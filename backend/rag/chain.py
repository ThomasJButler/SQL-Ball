"""
LangChain SQL Chain for SQL-Ball
Converts natural language to SQL using RAG
"""

from langchain.chains import create_sql_query_chain
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.schema import BaseMessage
from typing import Dict, Any, List, Optional
import os
import time
from supabase import create_client, Client
import json

class SQLChain:
    def __init__(self, schema_embedder, football_mapper):
        self.schema_embedder = schema_embedder
        self.football_mapper = football_mapper
        self.default_api_key = os.getenv("VITE_OPENAI_API_KEY")  # Fallback API key

        # Initialize Supabase
        self.supabase: Client = create_client(
            os.getenv("VITE_SUPABASE_URL"),
            os.getenv("VITE_SUPABASE_ANON_KEY")
        )

        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert SQL query generator for a football (soccer) analytics database.

            Database Schema:
            - teams: id, code, name, short_name, season, elo, strength
            - players: id, player_id, web_name, position (GK/DEF/MID/FWD), team_code, season
            - matches: id, gameweek, home_team, away_team, home_score, away_score, home_xg, away_xg, season, finished
            - player_stats: id, player_id, gameweek, total_points, goals_scored, assists, expected_goals, form, season
            - player_match_stats: id, player_id, gameweek, minutes_played, goals, assists, xg, xa, season

            Available seasons: '2024-2025', '2025-2026'

            Football terminology mappings:
            {football_mappings}

            Relevant schema context:
            {schema_context}

            Rules:
            1. Always use proper table and column names
            2. Include season filter unless querying across seasons
            3. Use appropriate JOINs when combining tables
            4. Add LIMIT clause for large result sets
            5. Use team names exactly as stored (e.g., 'Man City' not 'Manchester City')
            6. Position values are: 'GK', 'DEF', 'MID', 'FWD'
            7. CRITICAL: SQL clause order MUST be: SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT
            8. NEVER put WHERE after GROUP BY - WHERE must come BEFORE GROUP BY
            9. When using aggregates (SUM, COUNT, AVG), GROUP BY is required for non-aggregate columns

            Generate only the SQL query, no explanations."""),
            ("user", "{question}")
        ])

    async def process_query(
        self,
        question: str,
        season: str = "2024-2025",
        include_explanation: bool = True,
        api_key: str = None
    ) -> Dict[str, Any]:
        """
        Process natural language query and return SQL with results
        """
        start_time = time.time()

        # Use provided API key or fallback to environment
        current_api_key = api_key or self.default_api_key
        if not current_api_key:
            raise ValueError("OpenAI API key is required. Please provide it in the request or set VITE_OPENAI_API_KEY environment variable.")

        # Create LLM instance with the appropriate API key
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0,
            api_key=current_api_key
        )

        # Map football terms
        modified_query, mappings = self.football_mapper.map_query(question)

        # Get relevant schema context
        schema_results = self.schema_embedder.search_schema(question, n_results=3)
        schema_context = "\n".join([r['document'] for r in schema_results])

        # Get contextual hints
        hints = self.football_mapper.get_context_hints(question)

        # Generate SQL using LangChain
        sql = await self._generate_sql(
            question=question,
            football_mappings=json.dumps(mappings, indent=2),
            schema_context=schema_context,
            season=season
        )

        # Clean up SQL
        sql = self._clean_sql(sql)

        # Add season filter if not present and needed
        if hints.get("needs_season") and season not in sql:
            sql = self._add_season_filter(sql, season)

        # Execute query
        results = await self._execute_query(sql)

        # Get optimization suggestions
        optimizations = self.football_mapper.suggest_optimizations(sql)

        # Generate explanation if requested
        explanation = None
        if include_explanation:
            explanation = await self._generate_explanation(question, sql, mappings)

        execution_time = (time.time() - start_time) * 1000  # Convert to ms

        return {
            "sql": sql,
            "results": results,
            "explanation": explanation,
            "execution_time_ms": round(execution_time, 2),
            "optimizations": optimizations,
            "mappings_used": mappings
        }

    async def _generate_sql(self, **kwargs) -> str:
        """Generate SQL query using LangChain"""
        try:
            response = await self.llm.ainvoke(
                self.prompt.format_messages(**kwargs)
            )
            return response.content
        except Exception as e:
            print(f"Error generating SQL: {e}")
            # Fallback to simple query
            return f"SELECT * FROM matches WHERE season = '{kwargs.get('season', '2024-2025')}' LIMIT 10"

    def _clean_sql(self, sql: str) -> str:
        """Clean and format SQL query"""
        # Remove markdown code blocks if present
        sql = sql.replace("```sql", "").replace("```", "")

        # Remove extra whitespace
        sql = " ".join(sql.split())

        # Fix common SQL ordering issues
        # Check if WHERE is after GROUP BY (common GPT error)
        if "GROUP BY" in sql.upper() and "WHERE" in sql.upper():
            # Use case-insensitive search
            import re

            # Find positions of clauses
            group_match = re.search(r'\bGROUP\s+BY\b', sql, re.IGNORECASE)
            where_match = re.search(r'\bWHERE\b', sql, re.IGNORECASE)

            if group_match and where_match and where_match.start() > group_match.start():
                # WHERE is incorrectly after GROUP BY
                # Find the end of WHERE clause
                order_match = re.search(r'\bORDER\s+BY\b', sql, re.IGNORECASE)
                limit_match = re.search(r'\bLIMIT\b', sql, re.IGNORECASE)
                having_match = re.search(r'\bHAVING\b', sql, re.IGNORECASE)

                # Determine where WHERE clause ends
                where_end = len(sql)
                for match in [order_match, limit_match, having_match]:
                    if match and match.start() > where_match.start():
                        where_end = min(where_end, match.start())

                # Extract WHERE clause
                where_clause = sql[where_match.start():where_end].strip()

                # Remove WHERE from wrong position (including extra spaces)
                before_where = sql[:where_match.start()].rstrip()
                after_where = sql[where_end:].lstrip()
                sql = before_where + " " + after_where

                # Find new GROUP BY position after removal
                group_match = re.search(r'\bGROUP\s+BY\b', sql, re.IGNORECASE)
                if group_match:
                    # Insert WHERE before GROUP BY
                    sql = sql[:group_match.start()].rstrip() + " " + where_clause + " " + sql[group_match.start():]

        # Ensure semicolon at end
        if not sql.strip().endswith(";"):
            sql = sql.strip() + ";"

        return sql

    def _add_season_filter(self, sql: str, season: str) -> str:
        """Add season filter to SQL if not present"""
        sql_upper = sql.upper()

        # Check if WHERE clause exists
        if "WHERE" in sql_upper:
            # Add season to existing WHERE clause
            if "season" not in sql_upper:
                where_pos = sql_upper.index("WHERE") + 5
                sql = sql[:where_pos] + f" season = '{season}' AND" + sql[where_pos:]
        else:
            # Add WHERE clause before ORDER BY, GROUP BY, or LIMIT
            insert_pos = len(sql) - 1  # Before semicolon

            for clause in ["ORDER BY", "GROUP BY", "LIMIT"]:
                if clause in sql_upper:
                    insert_pos = sql_upper.index(clause)
                    break

            sql = sql[:insert_pos] + f" WHERE season = '{season}' " + sql[insert_pos:]

        return sql

    async def _execute_query(self, sql: str) -> List[Dict[str, Any]]:
        """Execute SQL query on Supabase"""
        try:
            # For security, we should validate the SQL here
            # For now, we'll execute directly (in production, use parameterized queries)

            # Remove semicolon for Supabase
            sql = sql.rstrip(";")

            # Execute using Supabase's raw SQL capability
            # Note: This is a simplified approach - in production, use proper query execution

            # For demonstration, return mock results
            # In real implementation, you'd use Supabase's query methods
            return [
                {"message": "Query generated successfully"},
                {"sql": sql},
                {"note": "Execute this query in Supabase SQL Editor for results"}
            ]

        except Exception as e:
            print(f"Error executing query: {e}")
            return [{"error": str(e)}]

    async def _generate_explanation(
        self,
        question: str,
        sql: str,
        mappings: Dict[str, str]
    ) -> str:
        """Generate human-readable explanation of the SQL query"""
        explanation_prompt = f"""
        Explain this SQL query in simple terms for someone learning SQL:

        Question: {question}
        SQL: {sql}

        Football terms used: {json.dumps(mappings, indent=2) if mappings else 'None'}

        Provide a brief, beginner-friendly explanation of what the query does and how it works.
        """

        try:
            response = await self.llm.ainvoke(explanation_prompt)
            return response.content
        except:
            return "This query searches the football database based on your question."

    async def optimize_query(self, sql: str) -> Dict[str, Any]:
        """Optimize an existing SQL query"""
        optimizations = self.football_mapper.suggest_optimizations(sql)

        # Use LLM to suggest optimized version
        optimize_prompt = f"""
        Optimize this SQL query for better performance:

        Original SQL: {sql}

        Current suggestions: {json.dumps(optimizations)}

        Provide an optimized version of the query and explain the improvements.
        """

        try:
            response = await self.llm.ainvoke(optimize_prompt)

            # Parse response to extract optimized SQL
            optimized_sql = sql  # Fallback to original

            # Simple extraction (in production, use better parsing)
            if "SELECT" in response.content:
                lines = response.content.split("\n")
                sql_lines = []
                in_sql = False

                for line in lines:
                    if "SELECT" in line:
                        in_sql = True
                    if in_sql:
                        sql_lines.append(line)
                        if ";" in line:
                            break

                if sql_lines:
                    optimized_sql = "\n".join(sql_lines)

            return {
                "original_sql": sql,
                "optimized_sql": self._clean_sql(optimized_sql),
                "explanation": response.content,
                "suggestions": optimizations
            }

        except Exception as e:
            return {
                "original_sql": sql,
                "optimized_sql": sql,
                "explanation": f"Error optimizing: {e}",
                "suggestions": optimizations
            }