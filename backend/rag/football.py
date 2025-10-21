"""
@author Tom Butler
@date 2025-10-21
@description Football domain terminology mapper. Converts natural language football concepts
             (team names, leagues, statistics terms) into SQL-compatible database references.
             Provides context hints and optimisation suggestions for sports analytics queries.
"""

from typing import Dict, List, Tuple, Any
import re

class FootballTermMapper:
    def __init__(self):
        # Position mappings
        self.positions = {
            "goalkeeper": "position = 'GK'",
            "keeper": "position = 'GK'",
            "gk": "position = 'GK'",
            "defender": "position = 'DEF'",
            "defence": "position = 'DEF'",
            "defender": "position = 'DEF'",
            "center back": "position = 'DEF'",
            "full back": "position = 'DEF'",
            "midfielder": "position = 'MID'",
            "midfield": "position = 'MID'",
            "striker": "position = 'FWD'",
            "forward": "position = 'FWD'",
            "attacker": "position = 'FWD'",
            "winger": "position IN ('MID', 'FWD')"
        }

        # Team groups
        self.team_groups = {
            "big six": ["Arsenal", "Chelsea", "Liverpool", "Man City", "Man Utd", "Tottenham"],
            "big 6": ["Arsenal", "Chelsea", "Liverpool", "Man City", "Man Utd", "Tottenham"],
            "london clubs": ["Arsenal", "Chelsea", "Tottenham", "Fulham", "Brentford", "West Ham"],
            "manchester clubs": ["Man City", "Man Utd"],
            "north london": ["Arsenal", "Tottenham"],
            "merseyside": ["Liverpool", "Everton"],
            "promoted": ["Leicester", "Ipswich", "Southampton"],  # 2024-25 promoted teams
            "relegated": ["Luton", "Burnley", "Sheffield Utd"]  # 2023-24 relegated teams
        }

        # Statistical concepts
        self.concepts = {
            "clean sheet": "goals_conceded = 0",
            "clean sheets": "clean_sheets > 0",
            "hat trick": "goals >= 3",
            "hattrick": "goals >= 3",
            "brace": "goals = 2",
            "double": "goals = 2",
            "assist": "assists > 0",
            "goal contribution": "(goals + assists)",
            "goal involvement": "(goals + assists)",
            "double digit haul": "total_points >= 10",
            "blank": "total_points <= 2",
            "benched": "minutes_played = 0",
            "starter": "minutes_played > 0",
            "full 90": "minutes_played >= 90",
            "substitute": "minutes_played > 0 AND minutes_played < 60",
            "red card": "red_cards > 0",
            "yellow card": "yellow_cards > 0",
            "booking": "yellow_cards > 0",
            "sent off": "red_cards > 0"
        }

        # Time periods
        self.time_periods = {
            "this season": "season = '2024-2025'",
            "current season": "season = '2024-2025'",
            "last season": "season = '2023-2024'",
            "previous season": "season = '2023-2024'",
            "this year": "season = '2024-2025'",
            "last year": "season = '2023-2024'",
            "december": "EXTRACT(MONTH FROM kickoff_time) = 12",
            "january": "EXTRACT(MONTH FROM kickoff_time) = 1",
            "festive period": "EXTRACT(MONTH FROM kickoff_time) IN (12, 1)",
            "last 5 games": "gameweek >= (SELECT MAX(gameweek) - 4 FROM matches WHERE finished = true)",
            "last 10 games": "gameweek >= (SELECT MAX(gameweek) - 9 FROM matches WHERE finished = true)"
        }

        # Performance metrics
        self.metrics = {
            "top scorer": "ORDER BY goals_scored DESC",
            "top scorers": "ORDER BY goals_scored DESC",
            "golden boot": "ORDER BY goals_scored DESC LIMIT 1",
            "most assists": "ORDER BY assists DESC",
            "best form": "ORDER BY form DESC",
            "worst form": "ORDER BY form ASC",
            "highest xg": "ORDER BY expected_goals DESC",
            "overperforming xg": "(goals_scored - expected_goals) DESC",
            "underperforming xg": "(expected_goals - goals_scored) DESC",
            "most minutes": "ORDER BY minutes DESC",
            "most points": "ORDER BY total_points DESC",
            "best value": "ORDER BY (total_points / (now_cost / 10.0)) DESC"
        }

        # Common aggregations
        self.aggregations = {
            "total": "SUM",
            "average": "AVG",
            "mean": "AVG",
            "maximum": "MAX",
            "minimum": "MIN",
            "count": "COUNT",
            "number of": "COUNT"
        }

    def map_query(self, query: str) -> Tuple[str, Dict[str, str]]:
        """
        Map natural language query to SQL patterns
        Returns: (modified_query, mappings_found)
        """
        query_lower = query.lower()
        mappings = {}

        # Check for position terms
        for term, sql in self.positions.items():
            if term in query_lower:
                mappings[f"position_{term}"] = sql

        # Check for team groups
        for group, teams in self.team_groups.items():
            if group in query_lower:
                team_list = "', '".join(teams)
                mappings[f"team_group_{group}"] = f"team IN ('{team_list}')"

        # Check for concepts
        for concept, sql in self.concepts.items():
            if concept in query_lower:
                mappings[f"concept_{concept}"] = sql

        # Check for time periods
        for period, sql in self.time_periods.items():
            if period in query_lower:
                mappings[f"time_{period}"] = sql

        # Check for metrics
        for metric, sql in self.metrics.items():
            if metric in query_lower:
                mappings[f"metric_{metric}"] = sql

        # Check for aggregations
        for agg, sql_func in self.aggregations.items():
            if agg in query_lower:
                mappings[f"agg_{agg}"] = sql_func

        return query, mappings

    def extract_team_names(self, query: str) -> List[str]:
        """Extract team names from query"""
        teams = [
            "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
            "Chelsea", "Crystal Palace", "Everton", "Fulham", "Ipswich",
            "Leicester", "Liverpool", "Man City", "Man Utd", "Newcastle",
            "Nottm Forest", "Southampton", "Tottenham", "West Ham", "Wolves"
        ]

        found_teams = []
        query_lower = query.lower()

        for team in teams:
            if team.lower() in query_lower:
                found_teams.append(team)

        # Handle common variations
        if "manchester united" in query_lower:
            found_teams.append("Man Utd")
        if "manchester city" in query_lower:
            found_teams.append("Man City")
        if "nottingham forest" in query_lower:
            found_teams.append("Nottm Forest")

        return list(set(found_teams))

    def extract_player_names(self, query: str) -> List[str]:
        """Extract potential player names from query"""
        # This would ideally query the database for actual player names
        # For now, we'll look for common patterns

        # Look for patterns like "Haaland", "Salah", "De Bruyne"
        words = query.split()
        potential_names = []

        for word in words:
            # Check if word starts with capital letter (potential name)
            if word and word[0].isupper() and len(word) > 3:
                # Filter out common words
                if word.lower() not in ["which", "what", "show", "find", "select", "from", "where"]:
                    potential_names.append(word)

        return potential_names

    def suggest_optimizations(self, sql: str) -> List[str]:
        """Suggest query optimizations"""
        suggestions = []

        # Check for SELECT *
        if "SELECT *" in sql.upper():
            suggestions.append("Consider selecting only needed columns instead of SELECT *")

        # Check for missing WHERE clause in large tables
        if "FROM matches" in sql and "WHERE" not in sql.upper():
            suggestions.append("Add a WHERE clause to filter matches (e.g., by season or gameweek)")

        # Check for missing indexes
        if "JOIN" in sql.upper():
            suggestions.append("Ensure foreign key columns are indexed for faster JOINs")

        # Check for DISTINCT usage
        if "DISTINCT" in sql.upper():
            suggestions.append("Consider if GROUP BY would be more efficient than DISTINCT")

        # Check for OR conditions
        if " OR " in sql.upper():
            suggestions.append("Consider using IN() instead of multiple OR conditions")

        return suggestions

    def get_context_hints(self, query: str) -> Dict[str, Any]:
        """Get contextual hints for query processing"""
        hints = {
            "needs_season": True,  # Most queries benefit from season filter
            "default_limit": 10,
            "order_direction": "DESC" if any(word in query.lower() for word in ["top", "best", "most", "highest"]) else "ASC"
        }

        # Check if query is about current/active data
        if any(word in query.lower() for word in ["current", "now", "today", "this"]):
            hints["season_filter"] = "2024-2025"

        # Check if query needs aggregation
        if any(word in query.lower() for word in ["total", "sum", "average", "count"]):
            hints["needs_grouping"] = True

        # Check if query is about specific gameweek
        gameweek_match = re.search(r'gameweek (\d+)', query.lower())
        if gameweek_match:
            hints["gameweek"] = int(gameweek_match.group(1))

        return hints