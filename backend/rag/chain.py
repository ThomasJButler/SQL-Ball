"""
LangChain SQL Chain for SQL-Ball
Converts natural language to SQL using RAG
"""

from langchain.chains import create_sql_query_chain
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain.schema import BaseMessage
from typing import Dict, Any, List, Optional, Union
import os
import time
from supabase import create_client, Client
import json

class SQLChain:
    def __init__(self, schema_embedder, football_mapper):
        self.schema_embedder = schema_embedder
        self.football_mapper = football_mapper
        self.default_api_key = os.getenv("VITE_OPENAI_API_KEY")  # Fallback API key
        self.llm: Optional[ChatOpenAI] = None  # Will be initialized when API key is available

        # Initialize Supabase
        supabase_url = os.getenv("VITE_SUPABASE_URL")
        supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
        
        if supabase_url and supabase_key:
            self.supabase: Optional[Client] = create_client(supabase_url, supabase_key)
        else:
            self.supabase: Optional[Client] = None
            print("Warning: Supabase configuration missing")

        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert PostgreSQL query generator for a Supabase football (soccer) analytics database.

            EXACT DATABASE SCHEMA (PostgreSQL/Supabase):

            European Football Leagues Database - 22 leagues across 11 countries

            Tables and ALL columns:

            leagues:
            - id (integer, PRIMARY KEY), code (varchar(10), UNIQUE), name (varchar(100)), country (varchar(50))
            - tier (integer), season (varchar(20) DEFAULT '2024-2025'), created_at (timestamp with time zone)

            Available leagues:
            - England: E0 (Premier League), E1 (Championship), E2 (League One), E3 (League Two), EC (National League)
            - Spain: SP1 (La Liga), SP2 (Segunda División)
            - Germany: D1 (Bundesliga), D2 (2. Bundesliga)
            - Italy: I1 (Serie A), I2 (Serie B)
            - France: F1 (Ligue 1), F2 (Ligue 2)
            - Netherlands: N1 (Eredivisie)
            - Belgium: B1 (Pro League)
            - Portugal: P1 (Primeira Liga)
            - Turkey: T1 (Süper Lig)
            - Greece: G1 (Super League)
            - Scotland: SC0 (Premiership), SC1 (Championship), SC2 (League One), SC3 (League Two)

            teams:
            - id (integer, PRIMARY KEY), name (varchar(100)), league_code (varchar(10) REFERENCES leagues(code))
            - season (varchar(20) DEFAULT '2024-2025'), created_at (timestamp with time zone)
            - UNIQUE constraint on (name, league_code, season)

            matches:
            - id (integer, PRIMARY KEY), div (varchar(10) REFERENCES leagues(code)), match_date (date), match_time (time)
            - home_team (varchar(100)), away_team (varchar(100)), home_score (integer), away_score (integer)
            - result (char(1): H/A/D), ht_home_score (integer), ht_away_score (integer), ht_result (char(1): H/A/D)
            - referee (varchar(100)), home_shots (integer), away_shots (integer)
            - home_shots_target (integer), away_shots_target (integer), home_fouls (integer), away_fouls (integer)
            - home_corners (integer), away_corners (integer), home_yellow_cards (integer), away_yellow_cards (integer)
            - home_red_cards (integer), away_red_cards (integer), season (varchar(20) DEFAULT '2024-2025')
            - created_at (timestamp with time zone)

            Available views for easier queries:

            match_results:
            - All match data with league_name, country, winner, total_goals

            team_stats:
            - Team statistics including wins, draws, losses, goals_for, goals_against per team/league/season

            Available season: '2024-2025' (single season only)

            Football terminology mappings:
            {football_mappings}

            Relevant schema context:
            {schema_context}

            POSTGRESQL/SUPABASE RULES (CRITICAL):
            1. Use EXACT column names from schema above - NO variations allowed
            2. Date field: Use 'match_date' NOT 'date' or 'kickoff_time' for match dates
            3. Text comparisons: Use single quotes 'text' NOT double quotes "text"
            4. League codes: Use exact codes (E0, SP1, D1, etc.) NOT league names in div column
            5. Team names: Use exact team names from database (Real Madrid, Man United, Liverpool, etc.)
            6. Season format: Use exact format '2024-2025' only
            7. Result values: 'H' (home win), 'A' (away win), 'D' (draw) - exact case
            8. SQL clause order: SELECT, FROM, JOIN, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT
            9. NEVER put WHERE after GROUP BY - WHERE must come BEFORE GROUP BY
            10. When using aggregates (SUM, COUNT, AVG), GROUP BY is required for non-aggregate columns
            11. Add LIMIT clause for large result sets to prevent timeouts
            12. Use proper PostgreSQL syntax for all operations
            13. Join teams table when you need team information by league
            14. Join leagues table when you need league names or country information

            EXAMPLES OF CORRECT vs INCORRECT SQL:
            ❌ WRONG: WHERE date > '2024-01-01'
            ✅ CORRECT: WHERE match_date > '2024-01-01'

            ❌ WRONG: WHERE div = 'Premier League'
            ✅ CORRECT: WHERE div = 'E0'

            ❌ WRONG: WHERE season = "2024-2025"
            ✅ CORRECT: WHERE season = '2024-2025'

            ❌ WRONG: SELECT * FROM matches WHERE league = 'England'
            ✅ CORRECT: SELECT m.* FROM matches m JOIN leagues l ON m.div = l.code WHERE l.country = 'England'

            The season parameter provided in this request is: {season}
            ALWAYS use this exact season value unless explicitly told otherwise.

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

        # Validate season usage - ensure request season is used
        sql = self._validate_season_usage(sql, season)

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
            if not self.llm:
                raise ValueError("LLM not initialized")
            response = await self.llm.ainvoke(
                self.prompt.format_messages(**kwargs)
            )
            # Ensure we return a string
            content = response.content
            if isinstance(content, str):
                return content
            else:
                return str(content)
        except Exception as e:
            print(f"Error generating SQL: {e}")
            # Use pattern-based fallback for common questions
            return self._generate_fallback_sql(kwargs.get('question', ''), kwargs.get('season', '2024-2025'))

    def _generate_fallback_sql(self, question: str, season: str) -> str:
        """Generate SQL using pattern matching when OpenAI is unavailable"""
        question_lower = question.lower()

        # Common query patterns for European leagues
        if "home record" in question_lower or "best home" in question_lower:
            return f"""SELECT home_team,
                COUNT(*) as total_games,
                SUM(CASE WHEN result = 'H' THEN 1 ELSE 0 END) as wins,
                SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END) as draws,
                SUM(CASE WHEN result = 'A' THEN 1 ELSE 0 END) as losses,
                SUM(home_score) as goals_for,
                SUM(away_score) as goals_against
                FROM matches
                WHERE season = '{season}'
                GROUP BY home_team
                ORDER BY wins DESC LIMIT 10"""

        elif "highest scoring" in question_lower or "most goals" in question_lower:
            return f"""SELECT home_team, away_team, home_score, away_score,
                (home_score + away_score) as total_goals, match_date
                FROM matches
                WHERE season = '{season}'
                ORDER BY total_goals DESC LIMIT 10"""

        elif "premier league" in question_lower or "england" in question_lower:
            return f"""SELECT m.*, l.name as league_name
                FROM matches m
                JOIN leagues l ON m.div = l.code
                WHERE m.season = '{season}' AND l.country = 'England'
                ORDER BY m.match_date DESC LIMIT 20"""

        elif "la liga" in question_lower or "spain" in question_lower:
            return f"""SELECT m.*, l.name as league_name
                FROM matches m
                JOIN leagues l ON m.div = l.code
                WHERE m.season = '{season}' AND l.country = 'Spain'
                ORDER BY m.match_date DESC LIMIT 20"""

        elif "bundesliga" in question_lower or "germany" in question_lower:
            return f"""SELECT m.*, l.name as league_name
                FROM matches m
                JOIN leagues l ON m.div = l.code
                WHERE m.season = '{season}' AND l.country = 'Germany'
                ORDER BY m.match_date DESC LIMIT 20"""

        elif "serie a" in question_lower or "italy" in question_lower:
            return f"""SELECT m.*, l.name as league_name
                FROM matches m
                JOIN leagues l ON m.div = l.code
                WHERE m.season = '{season}' AND l.country = 'Italy'
                ORDER BY m.match_date DESC LIMIT 20"""

        elif "team stats" in question_lower or "table" in question_lower:
            return f"""SELECT * FROM team_stats
                WHERE season = '{season}'
                ORDER BY wins DESC, goals_for DESC LIMIT 20"""

        else:
            # Generic fallback - recent matches
            return f"""SELECT m.home_team, m.away_team, m.home_score, m.away_score,
                m.result, m.match_date, l.name as league_name
                FROM matches m
                JOIN leagues l ON m.div = l.code
                WHERE m.season = '{season}'
                ORDER BY m.match_date DESC LIMIT 20"""

    def _clean_sql(self, sql: str) -> str:
        """Clean and format SQL query"""
        # Remove markdown code blocks if present
        sql = sql.replace("```sql", "").replace("```", "")

        # Remove extra whitespace
        sql = " ".join(sql.split())

        # Check for truncated queries (common issue)
        if sql.count("(") != sql.count(")"):
            print(f"⚠️  WARNING: Unbalanced parentheses detected in SQL: {sql}")
            # Try to fix by completing common patterns
            if "SUM(CASE WHEN" in sql and not sql.endswith("END)"):
                sql += " END)"

        # Check for incomplete column references
        if sql.endswith("_sco") and "away_score" in sql:
            sql = sql.replace("away_sco", "away_score")

        # Fix conflicting WHERE conditions
        import re

        # Look for impossible conditions like season = 'A' AND season = 'B'
        season_matches = re.findall(r"season\s*=\s*['\"]([^'\"]+)['\"]", sql, re.IGNORECASE)
        if len(season_matches) > 1 and len(set(season_matches)) > 1:
            print(f"🔧 FIXING: Found conflicting seasons: {season_matches}")

            # Keep only the first season occurrence and remove all others
            first_match = re.search(r"season\s*=\s*['\"][^'\"]+['\"]", sql, re.IGNORECASE)
            if first_match:
                first_season_clause = first_match.group(0)
                # Remove all season clauses first
                sql = re.sub(r"season\s*=\s*['\"][^'\"]+['\"]", "", sql, flags=re.IGNORECASE)
                # Clean up extra AND/WHERE keywords left behind
                sql = re.sub(r"\bAND\s+AND\b", "AND", sql, flags=re.IGNORECASE)
                sql = re.sub(r"\bWHERE\s+AND\b", "WHERE", sql, flags=re.IGNORECASE)
                sql = re.sub(r"\bAND\s+$", "", sql.strip(), flags=re.IGNORECASE)

                # Add back the first season clause in the right place
                if "WHERE" in sql.upper():
                    # Insert after WHERE
                    sql = re.sub(r"\bWHERE\b", f"WHERE {first_season_clause} AND", sql, count=1, flags=re.IGNORECASE)
                else:
                    # Add WHERE clause before GROUP BY/ORDER BY/LIMIT
                    insert_pos = len(sql)
                    for clause in ["GROUP BY", "ORDER BY", "LIMIT"]:
                        match = re.search(rf"\b{clause}\b", sql, re.IGNORECASE)
                        if match:
                            insert_pos = min(insert_pos, match.start())

                    sql = sql[:insert_pos].rstrip() + f" WHERE {first_season_clause} " + sql[insert_pos:]

            print(f"🔧 FIXED SQL: {sql}")

        # Fix common SQL ordering issues
        # Check if WHERE is after GROUP BY (common GPT error)
        if "GROUP BY" in sql.upper() and "WHERE" in sql.upper():
            # Use case-insensitive search

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

        # Validate final query
        if not self._validate_sql(sql):
            print(f"⚠️  WARNING: Generated SQL may have issues: {sql}")

        # Ensure semicolon at end
        if not sql.strip().endswith(";"):
            sql = sql.strip() + ";"

        return sql

    def _validate_sql(self, sql: str) -> bool:
        """Basic SQL validation"""
        try:
            import re
            sql_upper = sql.upper()

            # Check for basic requirements
            if not sql_upper.strip().startswith("SELECT"):
                return False

            # Check for balanced parentheses
            if sql.count("(") != sql.count(")"):
                return False

            # Check for incomplete expressions
            incomplete_patterns = [
                r'\w+_$',  # Ends with underscore
                r'\w+_\s+(FROM|WHERE|GROUP|ORDER)',  # Truncated column names
                r'=\s*$',  # Hanging equals
                r'AND\s*$',  # Hanging AND
            ]

            for pattern in incomplete_patterns:
                if re.search(pattern, sql, re.IGNORECASE):
                    return False

            return True

        except Exception as e:
            print(f"SQL validation error: {e}")
            return False

    def _validate_season_usage(self, sql: str, requested_season: str) -> str:
        """Ensure the SQL uses the requested season parameter"""
        import re

        # Find all season references in the SQL
        season_matches = re.findall(r"season\s*=\s*['\"]([^'\"]+)['\"]", sql, re.IGNORECASE)

        # If there are seasons in the SQL but none match the requested season
        if season_matches and requested_season not in season_matches:
            print(f"🔧 SEASON VALIDATION: SQL uses {season_matches} but request asks for '{requested_season}'")

            # Replace all season references with the requested season
            sql = re.sub(r"season\s*=\s*['\"][^'\"]+['\"]", f"season = '{requested_season}'", sql, flags=re.IGNORECASE)
            print(f"🔧 CORRECTED: Now using season = '{requested_season}'")

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
            if not self.llm:
                return "This query searches the football database based on your question."
            response = await self.llm.ainvoke(explanation_prompt)
            content = response.content
            if isinstance(content, str):
                return content
            else:
                return str(content)
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
            if not self.llm:
                return {
                    "original_sql": sql,
                    "optimized_sql": sql,
                    "explanation": "Optimization requires LLM initialization",
                    "suggestions": optimizations
                }
                
            response = await self.llm.ainvoke(optimize_prompt)
            content = response.content

            # Parse response to extract optimized SQL
            optimized_sql = sql  # Fallback to original
            
            # Convert content to string if needed
            content_str = str(content) if not isinstance(content, str) else content

            # Simple extraction (in production, use better parsing)
            if "SELECT" in content_str:
                lines = content_str.split("\n")
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
                "explanation": content_str,
                "suggestions": optimizations
            }

        except Exception as e:
            return {
                "original_sql": sql,
                "optimized_sql": sql,
                "explanation": f"Error optimizing: {e}",
                "suggestions": optimizations
            }
