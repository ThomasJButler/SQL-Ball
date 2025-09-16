"""
Query API endpoints for SQL-Ball
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    season: Optional[str] = "2024-2025"
    include_explanation: bool = True
    limit: Optional[int] = 10
    api_key: Optional[str] = None  # OpenAI API key from frontend

class QueryResponse(BaseModel):
    sql: str
    explanation: Optional[str] = None
    results: Optional[List[Dict[Any, Any]]] = None
    execution_time_ms: Optional[float] = None
    optimizations: Optional[List[str]] = None
    mappings_used: Optional[Dict[str, str]] = None

class SchemaResponse(BaseModel):
    tables: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]
    seasons: List[str]

# Store reference to sql_chain (will be set from main.py)
sql_chain = None
schema_embedder = None

def set_dependencies(chain, embedder):
    """Set dependencies from main app"""
    global sql_chain, schema_embedder
    sql_chain = chain
    schema_embedder = embedder

@router.post("/query", response_model=QueryResponse)
async def process_natural_language_query(request: QueryRequest):
    """
    Convert natural language to SQL and execute

    Examples:
    - "Show me the top scorers"
    - "Which team has the best home record?"
    - "Find players who scored hat tricks"
    """
    if not sql_chain:
        raise HTTPException(status_code=503, detail="Query system not initialized")

    try:
        # Pass API key to the chain if provided
        result = await sql_chain.process_query(
            question=request.question,
            season=request.season,
            include_explanation=request.include_explanation,
            api_key=request.api_key  # Pass API key from frontend
        )

        return QueryResponse(**result)

    except ValueError as e:
        # Handle missing API key and validation errors
        if "api key" in str(e).lower():
            raise HTTPException(
                status_code=401,
                detail=f"OpenAI API Key required: {str(e)}"
            )
        else:
            raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        # Log the full error for debugging
        print(f"🚨 ERROR: Query processing failed: {str(e)}")
        print(f"🚨 Question: {request.question}")

        # Return more specific error messages
        error_msg = str(e).lower()
        if "api" in error_msg and "key" in error_msg:
            raise HTTPException(
                status_code=401,
                detail="OpenAI API key is required for SQL generation"
            )
        elif "openai" in error_msg:
            raise HTTPException(
                status_code=502,
                detail="OpenAI API error - check your API key and quota"
            )
        elif "timeout" in error_msg:
            raise HTTPException(
                status_code=504,
                detail="Query processing timed out - try a simpler question"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Query processing failed: {str(e)}"
            )

@router.get("/schema", response_model=SchemaResponse)
async def get_database_schema():
    """
    Get database schema information
    """
    schema = {
        "tables": [
            {
                "name": "teams",
                "columns": ["id", "code", "name", "short_name", "season", "elo", "strength"],
                "description": "Premier League teams data"
            },
            {
                "name": "players",
                "columns": ["id", "player_id", "web_name", "position", "team_code", "season"],
                "description": "Player information"
            },
            {
                "name": "matches",
                "columns": ["id", "gameweek", "home_team", "away_team", "home_score", "away_score", "home_xg", "away_xg", "season"],
                "description": "Match results and statistics"
            },
            {
                "name": "player_stats",
                "columns": ["id", "player_id", "gameweek", "total_points", "goals_scored", "assists", "season"],
                "description": "FPL player statistics"
            },
            {
                "name": "player_match_stats",
                "columns": ["id", "player_id", "gameweek", "minutes_played", "goals", "assists", "xg", "season"],
                "description": "Individual match performance"
            }
        ],
        "relationships": [
            {
                "from": "players.team_code",
                "to": "teams.code",
                "type": "many_to_one"
            },
            {
                "from": "player_stats.player_id",
                "to": "players.player_id",
                "type": "many_to_one"
            },
            {
                "from": "player_match_stats.player_id",
                "to": "players.player_id",
                "type": "many_to_one"
            }
        ],
        "seasons": ["2024-2025", "2025-2026"]
    }

    return SchemaResponse(**schema)

@router.get("/examples")
async def get_example_queries():
    """
    Get example natural language queries
    """
    return {
        "examples": [
            {
                "category": "Top Performers",
                "queries": [
                    "Who are the top 5 scorers this season?",
                    "Which goalkeeper has the most clean sheets?",
                    "Show me players with the most assists"
                ]
            },
            {
                "category": "Team Analysis",
                "queries": [
                    "Which team has scored the most goals?",
                    "Show Arsenal's home record",
                    "Compare Manchester clubs' performance"
                ]
            },
            {
                "category": "Statistical Analysis",
                "queries": [
                    "Which players are overperforming their xG?",
                    "Find matches with the highest total goals",
                    "Show teams with best defensive record"
                ]
            },
            {
                "category": "Player Search",
                "queries": [
                    "Find all strikers who scored more than 10 goals",
                    "Which midfielders have the best form?",
                    "Show players who played every match"
                ]
            },
            {
                "category": "Pattern Discovery",
                "queries": [
                    "Which teams score most in the second half?",
                    "Find players who score against big six teams",
                    "Show home vs away performance differences"
                ]
            }
        ]
    }

@router.post("/validate")
async def validate_sql(sql: str):
    """
    Validate SQL syntax without executing
    """
    # Basic validation
    sql_upper = sql.upper()

    # Check for dangerous operations
    dangerous_keywords = ["DROP", "DELETE", "TRUNCATE", "INSERT", "UPDATE", "CREATE", "ALTER"]
    for keyword in dangerous_keywords:
        if keyword in sql_upper:
            return {
                "valid": False,
                "error": f"Dangerous operation '{keyword}' not allowed"
            }

    # Check for required SELECT
    if not sql_upper.strip().startswith("SELECT"):
        return {
            "valid": False,
            "error": "Only SELECT queries are allowed"
        }

    return {
        "valid": True,
        "message": "Query syntax appears valid"
    }

query_router = router