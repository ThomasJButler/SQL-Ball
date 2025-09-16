"""
SQL Execution API endpoints for SQL-Ball
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter()

class ExecuteRequest(BaseModel):
    sql: str

class ExecuteResponse(BaseModel):
    results: List[Dict[Any, Any]]
    execution_time_ms: Optional[float] = None
    rows_affected: Optional[int] = None

# Initialize Supabase client
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.")

supabase: Client = create_client(supabase_url, supabase_key)

@router.post("/execute", response_model=ExecuteResponse)
async def execute_sql_query(request: ExecuteRequest):
    """
    Execute a SQL query using Supabase RPC function
    """
    try:
        # Debug logging
        print(f"🔍 DEBUG: Received SQL query: {request.sql}")
        
        # Clean the SQL - remove trailing semicolon for Supabase RPC
        clean_sql = request.sql.strip().rstrip(';')
        
        # Fix PostgreSQL quote issues - convert double quotes around string literals to single quotes
        # This is a simple fix for common cases where values are wrapped in double quotes
        import re

        # Pattern to match = "value" and convert to = 'value'
        clean_sql = re.sub(r'=\s*"([^"]*)"', r"= '\1'", clean_sql)
        # Pattern to match IN ("value1", "value2") and convert to IN ('value1', 'value2')
        clean_sql = re.sub(r'IN\s*\(\s*"([^"]*)"', r"IN ('\1'", clean_sql)
        clean_sql = re.sub(r'",\s*"([^"]*)"', r"', '\1'", clean_sql)

        # AGGRESSIVE FIX: Detect and fix conflicting season conditions
        season_matches = re.findall(r"season\s*=\s*['\"]([^'\"]+)['\"]", clean_sql, re.IGNORECASE)
        if len(season_matches) > 1 and len(set(season_matches)) > 1:
            print(f"🚨 EXECUTE: Found conflicting seasons: {season_matches}")
            # Keep only the first season condition
            first_season = season_matches[0]
            clean_sql = re.sub(r"season\s*=\s*['\"][^'\"]+['\"]", f"season = '{first_season}'", clean_sql, flags=re.IGNORECASE)
            # Clean up multiple ANDs
            clean_sql = re.sub(r"\bAND\s+season\s*=\s*['\"][^'\"]+['\"]", "", clean_sql, flags=re.IGNORECASE)
            clean_sql = re.sub(r"\bAND\s+AND\b", "AND", clean_sql, flags=re.IGNORECASE)
            print(f"🔧 EXECUTE: Fixed to use only '{first_season}': {clean_sql}")

        # CRITICAL POSTGRESQL FIXES:
        # Fix boolean comparisons: finished = 1 -> finished = true
        clean_sql = re.sub(r'\bfinished\s*=\s*1\b', 'finished = true', clean_sql, flags=re.IGNORECASE)
        clean_sql = re.sub(r'\bfinished\s*=\s*0\b', 'finished = false', clean_sql, flags=re.IGNORECASE)

        # Fix column names that don't exist
        clean_sql = re.sub(r'\bdate\b', 'kickoff_time', clean_sql, flags=re.IGNORECASE)

        print(f"🔧 EXECUTE: Applied PostgreSQL fixes: {clean_sql}")
        
        print(f"🔍 DEBUG: Fixed SQL query: {clean_sql}")
        
        # Validate it's a SELECT query for security
        if not clean_sql.upper().strip().startswith('SELECT'):
            raise HTTPException(
                status_code=400, 
                detail="Only SELECT queries are allowed for security reasons"
            )
        
        # Execute using Supabase RPC function
        result = supabase.rpc('execute_sql', {'query_text': clean_sql}).execute()
        
        if result.data is None:
            raise HTTPException(status_code=500, detail="Query execution failed")
        
        # Check if the result contains an error
        if isinstance(result.data, dict) and result.data.get('error'):
            raise HTTPException(
                status_code=400,
                detail=f"SQL Error: {result.data.get('message', 'Unknown error')}"
            )
        
        # Ensure we return a list
        results = result.data if isinstance(result.data, list) else []
        
        return ExecuteResponse(
            results=results,
            execution_time_ms=None,  # Could add timing if needed
            rows_affected=len(results) if results else 0
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the full error for debugging
        print(f"🚨 ERROR: SQL execution failed: {str(e)}")
        print(f"🚨 SQL that failed: {clean_sql}")

        # Return more specific error messages
        if "does not exist" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail=f"SQL Error: Table or column does not exist - {str(e)}"
            )
        elif "syntax error" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail=f"SQL Syntax Error: {str(e)}"
            )
        elif "permission denied" in str(e).lower():
            raise HTTPException(
                status_code=403,
                detail="Database permission denied - check your query"
            )
        elif "season =" in clean_sql and clean_sql.count("season =") > 1:
            raise HTTPException(
                status_code=400,
                detail="SQL Error: Query contains conflicting season conditions - a row cannot match multiple seasons simultaneously"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Query execution failed: {str(e)}"
            )

execute_router = router
