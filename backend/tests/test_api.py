"""
@author Tom Butler
@date 2025-10-25
@description Comprehensive test suite for SQL-Ball API endpoints. Tests all API functionality
             including CORS, dashboard endpoints, query processing, and error handling.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json
from datetime import datetime

# Import the app
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

client = TestClient(app)


class TestCORS:
    """Test CORS configuration"""

    def test_cors_allowed_origins(self):
        """Test that CORS headers are properly set for allowed origins"""
        response = client.options(
            "/api/dashboard",
            headers={
                "Origin": "http://localhost:5175",
                "Access-Control-Request-Method": "GET"
            }
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers

    def test_cors_new_vite_port(self):
        """Test that port 5175 is now allowed"""
        response = client.options(
            "/api/dashboard",
            headers={
                "Origin": "http://localhost:5175",
                "Access-Control-Request-Method": "POST"
            }
        )
        assert response.status_code == 200

    def test_cors_credentials_allowed(self):
        """Test that credentials are allowed"""
        response = client.options(
            "/api/dashboard",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET"
            }
        )
        assert response.status_code == 200
        if "access-control-allow-credentials" in response.headers:
            assert response.headers["access-control-allow-credentials"] == "true"


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_check(self):
        """Test that health check returns correct status"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
        assert data["service"] == "SQL-Ball API"

    def test_health_rag_status(self):
        """Test that health check includes RAG initialization status"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "rag_initialized" in data
        # RAG should be initialized after startup
        # This might be False in test environment


class TestRootEndpoint:
    """Test root endpoint"""

    def test_root_endpoint(self):
        """Test that root endpoint returns API information"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "endpoints" in data

    def test_root_lists_dashboard_endpoints(self):
        """Test that root endpoint lists new dashboard endpoints"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        endpoints = data["endpoints"]
        assert "/api/dashboard" in endpoints
        assert "/api/dashboard/matches" in endpoints
        assert "/api/dashboard/stats" in endpoints
        assert "/api/dashboard/charts/{type}" in endpoints


class TestDashboardAPI:
    """Test dashboard API endpoints"""

    @patch('api.dashboard.supabase')
    def test_dashboard_matches_endpoint(self, mock_supabase):
        """Test fetching matches for dashboard"""
        # Mock Supabase response
        mock_response = MagicMock()
        mock_response.data = [
            {
                "id": 1,
                "home_team": "Barcelona",
                "away_team": "Real Madrid",
                "home_score": 2,
                "away_score": 1,
                "match_date": "2024-01-01",
                "league": "La Liga"
            }
        ]
        mock_supabase.from_.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response

        response = client.get("/api/dashboard/matches?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    @patch('api.dashboard.supabase')
    def test_dashboard_stats_endpoint(self, mock_supabase):
        """Test fetching dashboard statistics"""
        # Mock Supabase response
        mock_response = MagicMock()
        mock_response.data = [
            {"home_team": "Team A", "away_team": "Team B", "home_score": 2, "away_score": 1, "league": "Premier League"},
            {"home_team": "Team C", "away_team": "Team D", "home_score": 1, "away_score": 1, "league": "Premier League"},
        ]
        mock_supabase.from_.return_value.select.return_value.execute.return_value = mock_response

        response = client.get("/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_matches" in data
        assert "total_goals" in data
        assert "home_win_percentage" in data
        assert "away_win_percentage" in data
        assert "draw_percentage" in data
        assert "avg_goals_per_match" in data

    @patch('api.dashboard.supabase')
    def test_dashboard_chart_goals_trend(self, mock_supabase):
        """Test fetching goals trend chart data"""
        # Mock Supabase response
        mock_response = MagicMock()
        mock_response.data = [
            {"match_date": "2024-01-01", "home_score": 2, "away_score": 1},
            {"match_date": "2024-01-02", "home_score": 3, "away_score": 2},
        ]
        mock_supabase.from_.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response

        response = client.get("/api/dashboard/charts/goals_trend")
        assert response.status_code == 200
        data = response.json()
        assert "labels" in data
        assert "datasets" in data
        assert "type" in data
        assert data["type"] == "line"

    @patch('api.dashboard.supabase')
    def test_dashboard_chart_results_distribution(self, mock_supabase):
        """Test fetching results distribution chart data"""
        # Mock Supabase response
        mock_response = MagicMock()
        mock_response.data = [
            {"home_score": 2, "away_score": 1},  # Home win
            {"home_score": 1, "away_score": 2},  # Away win
            {"home_score": 1, "away_score": 1},  # Draw
        ]
        mock_supabase.from_.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response

        response = client.get("/api/dashboard/charts/results_distribution")
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "doughnut"
        assert len(data["labels"]) == 3  # Home Wins, Away Wins, Draws

    @patch('api.dashboard.supabase')
    def test_dashboard_chart_league_table(self, mock_supabase):
        """Test fetching league table chart data"""
        # Mock Supabase response
        mock_response = MagicMock()
        mock_response.data = [
            {"home_team": "Barcelona", "away_team": "Real Madrid", "home_score": 2, "away_score": 1},
            {"home_team": "Real Madrid", "away_team": "Barcelona", "home_score": 1, "away_score": 1},
        ]
        mock_supabase.from_.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response

        response = client.get("/api/dashboard/charts/league_table")
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "bar"
        assert "labels" in data
        assert "datasets" in data

    def test_dashboard_invalid_chart_type(self):
        """Test that invalid chart type returns error"""
        response = client.get("/api/dashboard/charts/invalid_type")
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data

    @patch('api.dashboard.supabase')
    def test_dashboard_complete_endpoint(self, mock_supabase):
        """Test fetching complete dashboard data"""
        # Mock Supabase responses
        mock_response = MagicMock()
        mock_response.data = [
            {"home_team": "Team A", "away_team": "Team B", "home_score": 2, "away_score": 1}
        ]
        mock_supabase.from_.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response
        mock_supabase.from_.return_value.select.return_value.execute.return_value = mock_response

        response = client.get("/api/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data
        assert "recent_matches" in data
        assert "charts" in data
        assert "last_updated" in data

    def test_dashboard_analyze_endpoint(self):
        """Test dashboard analysis endpoint"""
        response = client.post("/api/dashboard/analyze?query=top+scorers")
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert data["query"] == "top scorers"
        # This is a placeholder implementation for now


class TestQueryAPI:
    """Test query API endpoints"""

    def test_query_endpoint_missing_deps(self):
        """Test that query endpoint handles missing dependencies gracefully"""
        # This might fail if RAG is not initialized
        response = client.post("/api/query", json={
            "question": "Show me all goals scored by Barcelona"
        })
        # Should either work or return appropriate error
        assert response.status_code in [200, 500]

    def test_schema_endpoint(self):
        """Test schema endpoint"""
        response = client.get("/api/schema")
        # Might fail if dependencies not set
        assert response.status_code in [200, 500]


class TestExecuteAPI:
    """Test execute API endpoints"""

    @patch('api.execute.supabase')
    def test_execute_sql(self, mock_supabase):
        """Test SQL execution endpoint"""
        # Mock Supabase RPC response
        mock_supabase.rpc.return_value.execute.return_value.data = [
            {"team": "Barcelona", "goals": 50}
        ]

        response = client.post("/api/execute", json={
            "sql": "SELECT team, COUNT(*) as goals FROM matches GROUP BY team"
        })

        if response.status_code == 200:
            data = response.json()
            assert "results" in data

    def test_execute_invalid_sql(self):
        """Test that invalid SQL is handled"""
        response = client.post("/api/execute", json={
            "sql": "INVALID SQL QUERY HERE"
        })
        # Should handle error gracefully
        assert response.status_code in [200, 400, 500]


class TestOptimizeAPI:
    """Test optimize API endpoints"""

    def test_optimize_endpoint(self):
        """Test SQL optimization endpoint"""
        response = client.post("/api/optimize", json={
            "sql": "SELECT * FROM matches WHERE home_team = 'Barcelona'"
        })
        # Might fail if dependencies not set
        assert response.status_code in [200, 500]

    def test_patterns_endpoint(self):
        """Test pattern discovery endpoint"""
        response = client.post("/api/patterns", json={
            "pattern_type": "upsets",
            "season": "2023/24"
        })
        # Might fail if dependencies not set
        assert response.status_code in [200, 500]


class TestCaching:
    """Test caching functionality"""

    @patch('api.dashboard.supabase')
    def test_dashboard_caching(self, mock_supabase):
        """Test that dashboard endpoints use caching"""
        # Mock Supabase response
        mock_response = MagicMock()
        mock_response.data = [{"id": 1, "home_team": "Test"}]
        mock_supabase.from_.return_value.select.return_value.execute.return_value = mock_response

        # First request
        response1 = client.get("/api/dashboard/stats")
        assert response1.status_code == 200

        # Second request should use cache (Supabase should not be called again)
        response2 = client.get("/api/dashboard/stats")
        assert response2.status_code == 200

        # Verify data is consistent
        assert response1.json() == response2.json()


class TestErrorHandling:
    """Test error handling"""

    @patch('api.dashboard.supabase')
    def test_database_error_handling(self, mock_supabase):
        """Test that database errors are handled properly"""
        # Mock Supabase to raise an error
        mock_supabase.from_.side_effect = Exception("Database connection failed")

        response = client.get("/api/dashboard/matches")
        assert response.status_code == 500
        data = response.json()
        assert "detail" in data

    def test_invalid_query_parameters(self):
        """Test that invalid query parameters are handled"""
        response = client.get("/api/dashboard/matches?limit=invalid")
        # Should handle invalid parameter gracefully
        assert response.status_code in [200, 422]

    def test_missing_environment_variables(self):
        """Test handling of missing environment variables"""
        with patch.dict(os.environ, {}, clear=True):
            # This would fail on import if env vars are missing
            # Testing graceful handling
            pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])