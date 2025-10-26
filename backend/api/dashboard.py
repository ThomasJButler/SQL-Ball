"""
@author Tom Butler
@date 2025-10-25
@description Dashboard API endpoints for efficient data serving. Provides cached access to
             European league statistics, match data, and chart-ready visualizations.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
from supabase import create_client, Client
import os
from functools import lru_cache
import asyncio

# Initialize router
router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv("VITE_SUPABASE_URL")
supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase configuration for dashboard API")

supabase: Client = create_client(supabase_url, supabase_key)

# Cache for dashboard data (simple in-memory cache)
cache = {}
CACHE_TTL = 3600  # 1 hour cache

class DashboardStats(BaseModel):
    total_matches: int
    total_goals: int
    home_win_percentage: float
    away_win_percentage: float
    draw_percentage: float
    avg_goals_per_match: float
    total_teams: int
    total_leagues: int
    high_scoring_matches: int
    clean_sheets: int

class ChartData(BaseModel):
    labels: List[str]
    datasets: List[Dict[str, Any]]
    type: str

class DashboardResponse(BaseModel):
    stats: DashboardStats
    recent_matches: List[Dict[str, Any]]
    charts: Dict[str, ChartData]
    last_updated: datetime

def get_cache_key(endpoint: str, params: dict = None) -> str:
    """Generate cache key for endpoint and params"""
    if params:
        param_str = json.dumps(params, sort_keys=True)
        return f"{endpoint}:{param_str}"
    return endpoint

def is_cache_valid(cache_entry: dict) -> bool:
    """Check if cache entry is still valid"""
    if not cache_entry:
        return False
    cached_time = cache_entry.get('timestamp', 0)
    return (datetime.now().timestamp() - cached_time) < CACHE_TTL

@router.get("/dashboard/matches")
async def get_dashboard_matches(
    limit: int = Query(1000, description="Number of matches to fetch"),
    league: Optional[str] = Query(None, description="Filter by league")
):
    """
    Get matches for dashboard with caching
    """
    cache_key = get_cache_key("matches", {"limit": limit, "league": league})

    # Check cache
    if cache_key in cache and is_cache_valid(cache[cache_key]):
        return cache[cache_key]['data']

    try:
        # Build query
        query = supabase.from_('matches').select('*')

        if league:
            query = query.eq('div', league)

        # Fetch data
        response = query.order('match_date', desc=True).limit(limit).execute()

        if response.data:
            # Cache the result
            cache[cache_key] = {
                'data': response.data,
                'timestamp': datetime.now().timestamp()
            }
            return response.data
        else:
            return []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch matches: {str(e)}")

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(league: Optional[str] = Query(None, description="Filter by league")):
    """
    Get pre-calculated dashboard statistics
    """
    cache_key = get_cache_key("stats", {"league": league})

    # Check cache
    if cache_key in cache and is_cache_valid(cache[cache_key]):
        return cache[cache_key]['data']

    try:
        # Fetch matches for stats calculation
        query = supabase.from_('matches').select('*')
        if league:
            query = query.eq('div', league)

        response = query.execute()
        matches = response.data if response.data else []

        # Calculate statistics
        total_matches = len(matches)
        total_goals = sum((m.get('home_score', 0) or 0) + (m.get('away_score', 0) or 0) for m in matches)

        home_wins = sum(1 for m in matches if (m.get('home_score', 0) or 0) > (m.get('away_score', 0) or 0))
        away_wins = sum(1 for m in matches if (m.get('away_score', 0) or 0) > (m.get('home_score', 0) or 0))
        draws = sum(1 for m in matches if (m.get('home_score', 0) or 0) == (m.get('away_score', 0) or 0))

        # Get unique teams and leagues
        teams = set()
        leagues = set()
        for match in matches:
            if match.get('home_team'):
                teams.add(match['home_team'])
            if match.get('away_team'):
                teams.add(match['away_team'])
            if match.get('league'):
                leagues.add(match['league'])

        # Calculate additional stats
        high_scoring = sum(1 for m in matches if (m.get('home_score', 0) or 0) + (m.get('away_score', 0) or 0) > 4)
        clean_sheets = sum(1 for m in matches if (m.get('home_score', 0) == 0 or m.get('away_score', 0) == 0))

        stats = DashboardStats(
            total_matches=total_matches,
            total_goals=total_goals,
            home_win_percentage=(home_wins / total_matches * 100) if total_matches > 0 else 0,
            away_win_percentage=(away_wins / total_matches * 100) if total_matches > 0 else 0,
            draw_percentage=(draws / total_matches * 100) if total_matches > 0 else 0,
            avg_goals_per_match=(total_goals / total_matches) if total_matches > 0 else 0,
            total_teams=len(teams),
            total_leagues=len(leagues),
            high_scoring_matches=high_scoring,
            clean_sheets=clean_sheets
        )

        # Cache the result
        cache[cache_key] = {
            'data': stats,
            'timestamp': datetime.now().timestamp()
        }

        return stats

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate stats: {str(e)}")

@router.get("/dashboard/charts/{chart_type}")
async def get_chart_data(
    chart_type: str,
    league: Optional[str] = Query(None, description="Filter by league")
):
    """
    Get chart-ready data for specific visualization types
    """
    cache_key = get_cache_key(f"chart_{chart_type}", {"league": league})

    # Check cache
    if cache_key in cache and is_cache_valid(cache[cache_key]):
        return cache[cache_key]['data']

    try:
        # Fetch matches
        query = supabase.from_('matches').select('*')
        if league:
            query = query.eq('div', league)

        response = query.order('match_date', desc=True).limit(1000).execute()
        matches = response.data if response.data else []

        chart_data = None

        if chart_type == "goals_trend":
            # Calculate goals per match over time
            dates = []
            home_goals = []
            away_goals = []
            total_goals = []

            for match in matches[:30]:  # Last 30 matches for better chart readability
                # Format date as "Mon DD" for better display
                match_date = match.get('match_date', '')
                if match_date:
                    try:
                        dt = datetime.fromisoformat(str(match_date).replace('Z', '+00:00'))
                        formatted_date = dt.strftime('%b %d')
                    except:
                        formatted_date = str(match_date)[:10]  # Fallback to YYYY-MM-DD
                else:
                    formatted_date = ''

                dates.append(formatted_date)
                home_goals.append(match.get('home_score', 0) or 0)
                away_goals.append(match.get('away_score', 0) or 0)
                total_goals.append((match.get('home_score', 0) or 0) + (match.get('away_score', 0) or 0))

            chart_data = ChartData(
                labels=dates[::-1],  # Reverse for chronological order
                datasets=[
                    {"label": "Home Goals", "data": home_goals[::-1], "borderColor": "#4ade80"},
                    {"label": "Away Goals", "data": away_goals[::-1], "borderColor": "#f97316"},
                    {"label": "Total Goals", "data": total_goals[::-1], "borderColor": "#ef4444"}
                ],
                type="line"
            )

        elif chart_type == "results_distribution":
            # Calculate win/draw distribution
            home_wins = sum(1 for m in matches if (m.get('home_score', 0) or 0) > (m.get('away_score', 0) or 0))
            away_wins = sum(1 for m in matches if (m.get('away_score', 0) or 0) > (m.get('home_score', 0) or 0))
            draws = sum(1 for m in matches if (m.get('home_score', 0) or 0) == (m.get('away_score', 0) or 0))

            chart_data = ChartData(
                labels=["Home Wins", "Away Wins", "Draws"],
                datasets=[{
                    "data": [home_wins, away_wins, draws],
                    "backgroundColor": ["#4ade80", "#f97316", "#60a5fa"]
                }],
                type="doughnut"
            )

        elif chart_type == "league_table":
            # Calculate points per team
            teams_data = {}

            for match in matches:
                home_team = match.get('home_team')
                away_team = match.get('away_team')
                home_score = match.get('home_score', 0) or 0
                away_score = match.get('away_score', 0) or 0

                if home_team:
                    if home_team not in teams_data:
                        teams_data[home_team] = {"points": 0, "matches": 0}
                    teams_data[home_team]["matches"] += 1

                    if home_score > away_score:
                        teams_data[home_team]["points"] += 3
                    elif home_score == away_score:
                        teams_data[home_team]["points"] += 1

                if away_team:
                    if away_team not in teams_data:
                        teams_data[away_team] = {"points": 0, "matches": 0}
                    teams_data[away_team]["matches"] += 1

                    if away_score > home_score:
                        teams_data[away_team]["points"] += 3
                    elif away_score == home_score:
                        teams_data[away_team]["points"] += 1

            # Sort teams by points
            sorted_teams = sorted(teams_data.items(), key=lambda x: x[1]["points"], reverse=True)[:10]

            chart_data = ChartData(
                labels=[team for team, _ in sorted_teams],
                datasets=[{
                    "label": "Points",
                    "data": [data["points"] for _, data in sorted_teams],
                    "backgroundColor": "#4ade80"
                }],
                type="bar"
            )

        elif chart_type == "goal_distribution":
            # Calculate goals per match distribution
            distribution = {}
            for match in matches:
                total_goals = (match.get('home_score', 0) or 0) + (match.get('away_score', 0) or 0)
                key = '6+' if total_goals >= 6 else str(total_goals)
                distribution[key] = distribution.get(key, 0) + 1

            labels = ['0', '1', '2', '3', '4', '5', '6+']
            data = [distribution.get(label, 0) for label in labels]

            chart_data = ChartData(
                labels=labels,
                datasets=[{
                    "label": "Number of Matches",
                    "data": data,
                    "backgroundColor": "rgba(16, 185, 129, 0.6)",
                    "borderColor": "rgba(16, 185, 129, 1)"
                }],
                type="bar"
            )

        elif chart_type == "team_performance":
            # Calculate comprehensive team statistics for radar chart
            teams_data = {}

            for match in matches:
                home_team = match.get('home_team')
                away_team = match.get('away_team')
                home_score = match.get('home_score', 0) or 0
                away_score = match.get('away_score', 0) or 0

                # Initialize teams if not exists
                for team in [home_team, away_team]:
                    if team and team not in teams_data:
                        teams_data[team] = {
                            "wins": 0, "points": 0, "goals": 0,
                            "goals_against": 0, "matches": 0
                        }

                if home_team:
                    teams_data[home_team]["matches"] += 1
                    teams_data[home_team]["goals"] += home_score
                    teams_data[home_team]["goals_against"] += away_score
                    if home_score > away_score:
                        teams_data[home_team]["wins"] += 1
                        teams_data[home_team]["points"] += 3
                    elif home_score == away_score:
                        teams_data[home_team]["points"] += 1

                if away_team:
                    teams_data[away_team]["matches"] += 1
                    teams_data[away_team]["goals"] += away_score
                    teams_data[away_team]["goals_against"] += home_score
                    if away_score > home_score:
                        teams_data[away_team]["wins"] += 1
                        teams_data[away_team]["points"] += 3
                    elif away_score == home_score:
                        teams_data[away_team]["points"] += 1

            # Sort teams by points and take top 6
            sorted_teams = sorted(teams_data.items(), key=lambda x: x[1]["points"], reverse=True)[:6]
            colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

            datasets = []
            for idx, (team, stats) in enumerate(sorted_teams):
                matches_played = max(stats["matches"], 1)
                goal_diff = stats["goals"] - stats["goals_against"]

                datasets.append({
                    "label": team,
                    "data": [
                        stats["wins"] * 2,  # Wins scaled
                        (stats["points"] / matches_played) * 10,  # Points per game
                        (stats["goals"] / matches_played) * 15,  # Goals per game
                        max(0, 20 - (stats["goals_against"] / matches_played * 10)),  # Defense
                        max(0, min(goal_diff * 2, 20))  # Form based on goal difference
                    ],
                    "borderColor": colors[idx],
                    "backgroundColor": colors[idx] + "30"
                })

            chart_data = ChartData(
                labels=['Wins', 'Points/Game', 'Goals/Game', 'Defense', 'Form'],
                datasets=datasets,
                type="radar"
            )

        else:
            raise HTTPException(status_code=400, detail=f"Unknown chart type: {chart_type}")

        # Cache the result
        cache[cache_key] = {
            'data': chart_data,
            'timestamp': datetime.now().timestamp()
        }

        return chart_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate chart data: {str(e)}")

@router.get("/dashboard", response_model=DashboardResponse)
async def get_complete_dashboard(
    league: Optional[str] = Query(None, description="Filter by league")
):
    """
    Get complete dashboard data in one request
    """
    try:
        # Fetch all data in parallel
        stats_task = get_dashboard_stats(league)
        matches_task = get_dashboard_matches(100, league)
        goals_chart_task = get_chart_data("goals_trend", league)
        results_chart_task = get_chart_data("results_distribution", league)
        table_chart_task = get_chart_data("league_table", league)
        goal_dist_chart_task = get_chart_data("goal_distribution", league)
        team_perf_chart_task = get_chart_data("team_performance", league)

        # Wait for all tasks
        stats, matches, goals_chart, results_chart, table_chart, goal_dist_chart, team_perf_chart = await asyncio.gather(
            stats_task, matches_task, goals_chart_task, results_chart_task, table_chart_task,
            goal_dist_chart_task, team_perf_chart_task
        )

        return DashboardResponse(
            stats=stats,
            recent_matches=matches,
            charts={
                "goals_trend": goals_chart,
                "results_distribution": results_chart,
                "league_table": table_chart,
                "goal_distribution": goal_dist_chart,
                "team_performance": team_perf_chart
            },
            last_updated=datetime.now()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")

@router.post("/dashboard/analyze")
async def analyze_dashboard_data(
    query: str = Query(..., description="Analysis query"),
    league: Optional[str] = Query(None, description="Filter by league")
):
    """
    Use RAG system to analyze dashboard data intelligently
    """
    # This would integrate with the existing RAG system
    # For now, return a placeholder
    return {
        "query": query,
        "analysis": "Analysis would be performed by RAG system",
        "league": league
    }