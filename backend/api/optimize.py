"""
@author Tom Butler
@date 2025-10-21
@description Query optimisation API endpoints. Analyses SQL for performance improvements,
             discovers patterns in queries, generates suggestions, and explains query execution plans.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter()

class OptimizeRequest(BaseModel):
    sql: str
    context: Optional[str] = None

class OptimizeResponse(BaseModel):
    original_sql: str
    optimized_sql: str
    explanation: str
    suggestions: List[str]
    performance_estimate: Optional[Dict[str, Any]] = None

class PatternRequest(BaseModel):
    table: str
    column: Optional[str] = None
    pattern_type: str = "anomaly"  # anomaly, trend, correlation

class PatternResponse(BaseModel):
    patterns: List[Dict[str, Any]]
    sql_queries: List[str]
    visualizations: Optional[List[str]] = None

# Reference to sql_chain
sql_chain = None

def set_sql_chain(chain):
    """Set SQL chain from main app"""
    global sql_chain
    sql_chain = chain

@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_query(request: OptimizeRequest):
    """
    Optimize an SQL query for better performance
    """
    if not sql_chain:
        raise HTTPException(status_code=503, detail="Optimization system not initialized")

    try:
        result = await sql_chain.optimize_query(request.sql)
        return OptimizeResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@router.post("/patterns", response_model=PatternResponse)
async def discover_patterns(request: PatternRequest):
    """
    Discover patterns in the data
    """
    patterns = []
    sql_queries = []

    # Pattern discovery logic based on type
    if request.pattern_type == "anomaly":
        if request.table == "matches":
            patterns.append({
                "type": "anomaly",
                "description": "Matches where actual goals significantly exceeded xG",
                "confidence": 0.85
            })
            sql_queries.append("""
                SELECT home_team, away_team, home_score, away_score,
                       home_xg, away_xg,
                       (home_score - home_xg) as home_overperformance,
                       (away_score - away_xg) as away_overperformance
                FROM matches
                WHERE ABS(home_score - home_xg) > 2
                   OR ABS(away_score - away_xg) > 2
                ORDER BY gameweek DESC
                LIMIT 10
            """)

        elif request.table == "player_stats":
            patterns.append({
                "type": "anomaly",
                "description": "Players with exceptional form relative to season average",
                "confidence": 0.78
            })
            sql_queries.append("""
                SELECT p.web_name, ps.form, ps.total_points,
                       AVG(ps.total_points) OVER (PARTITION BY ps.player_id) as avg_points
                FROM player_stats ps
                JOIN players p ON ps.player_id = p.player_id
                WHERE ps.form > 8.0
                  AND ps.season = '2024-2025'
                ORDER BY ps.form DESC
                LIMIT 10
            """)

    elif request.pattern_type == "trend":
        if request.table == "matches":
            patterns.append({
                "type": "trend",
                "description": "Goal scoring trends across gameweeks",
                "confidence": 0.92
            })
            sql_queries.append("""
                SELECT gameweek,
                       AVG(home_score + away_score) as avg_total_goals,
                       AVG(home_xg + away_xg) as avg_total_xg
                FROM matches
                WHERE season = '2024-2025'
                GROUP BY gameweek
                ORDER BY gameweek
            """)

    elif request.pattern_type == "correlation":
        patterns.append({
            "type": "correlation",
            "description": "Correlation between possession and goals scored",
            "confidence": 0.67
        })
        sql_queries.append("""
            SELECT
                CASE
                    WHEN home_possession > 60 THEN 'High (>60%)'
                    WHEN home_possession > 50 THEN 'Medium (50-60%)'
                    ELSE 'Low (<50%)'
                END as possession_range,
                AVG(home_score) as avg_goals,
                COUNT(*) as match_count
            FROM matches
            WHERE home_possession IS NOT NULL
              AND season = '2024-2025'
            GROUP BY possession_range
            ORDER BY avg_goals DESC
        """)

    return PatternResponse(
        patterns=patterns,
        sql_queries=sql_queries,
        visualizations=["bar_chart", "line_graph"] if patterns else None
    )

@router.get("/suggestions/{query_type}")
async def get_query_suggestions(query_type: str):
    """
    Get query optimization suggestions for specific query types
    """
    suggestions_map = {
        "aggregation": [
            "Use GROUP BY with aggregate functions (SUM, AVG, COUNT)",
            "Consider adding HAVING clause for filtering grouped results",
            "Use window functions for running totals or rankings"
        ],
        "join": [
            "Ensure join columns are indexed",
            "Join smaller tables first",
            "Use INNER JOIN when possible instead of LEFT JOIN",
            "Consider denormalizing frequently joined data"
        ],
        "filtering": [
            "Add indexes on WHERE clause columns",
            "Use IN() instead of multiple OR conditions",
            "Place most selective filters first",
            "Consider using EXISTS instead of IN for subqueries"
        ],
        "sorting": [
            "Create composite indexes for ORDER BY columns",
            "Limit results before sorting when possible",
            "Consider using LIMIT with ORDER BY",
            "Avoid sorting on calculated fields"
        ]
    }

    if query_type not in suggestions_map:
        raise HTTPException(status_code=404, detail=f"Unknown query type: {query_type}")

    return {
        "query_type": query_type,
        "suggestions": suggestions_map[query_type]
    }

@router.post("/explain")
async def explain_query_plan(sql: str):
    """
    Explain query execution plan in simple terms
    """
    # Simplified explanation logic
    explanation_parts = []

    sql_upper = sql.upper()

    # Analyze query components
    if "SELECT" in sql_upper:
        if "*" in sql:
            explanation_parts.append("Selecting all columns (consider specifying only needed columns)")
        else:
            explanation_parts.append("Selecting specific columns (good practice)")

    if "JOIN" in sql_upper:
        join_count = sql_upper.count("JOIN")
        explanation_parts.append(f"Joining {join_count} table(s)")

    if "WHERE" in sql_upper:
        explanation_parts.append("Filtering results with WHERE clause")

    if "GROUP BY" in sql_upper:
        explanation_parts.append("Grouping results for aggregation")

    if "ORDER BY" in sql_upper:
        explanation_parts.append("Sorting results")

    if "LIMIT" in sql_upper:
        explanation_parts.append("Limiting result set size")

    # Performance estimate
    estimated_speed = "Fast"
    if "JOIN" in sql_upper and sql_upper.count("JOIN") > 2:
        estimated_speed = "Moderate"
    if "*" in sql and "JOIN" in sql_upper:
        estimated_speed = "Slow"

    return {
        "sql": sql,
        "explanation": explanation_parts,
        "estimated_speed": estimated_speed,
        "tips": [
            "Add indexes on JOIN and WHERE columns",
            "Use EXPLAIN ANALYZE for detailed performance metrics",
            "Consider caching frequently run queries"
        ]
    }

optimize_router = router