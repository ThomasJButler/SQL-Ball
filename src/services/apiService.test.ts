/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description Test suite for API service. Tests all API methods including dashboard endpoints,
 *              query conversion, SQL optimization, and error handling scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from './apiService';

// Mock fetch globally
global.fetch = vi.fn();

describe('APIService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('healthCheck', () => {
    it('should return true when backend is healthy and RAG is initialized', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy', rag_initialized: true }),
      });

      const result = await apiService.healthCheck();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/health');
    });

    it('should return false when backend is unhealthy', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'unhealthy', rag_initialized: false }),
      });

      const result = await apiService.healthCheck();
      expect(result).toBe(false);
    });

    it('should return false when fetch fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await apiService.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('convertToSQL', () => {
    it('should convert natural language to SQL', async () => {
      const mockResponse = {
        sql: 'SELECT * FROM matches WHERE home_team = "Barcelona"',
        explanation: 'Query to get Barcelona home matches',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.convertToSQL({
        question: 'Show me Barcelona home matches',
        season: '2023/24',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/query',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: 'Show me Barcelona home matches',
            season: '2023/24',
          }),
        }
      );
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(
        apiService.convertToSQL({ question: 'test' })
      ).rejects.toThrow('API request failed: Internal Server Error');
    });
  });

  describe('getDashboardData', () => {
    it('should fetch complete dashboard data', async () => {
      const mockDashboard = {
        stats: {
          total_matches: 1000,
          total_goals: 2500,
          home_win_percentage: 44.5,
          away_win_percentage: 35.2,
          draw_percentage: 20.3,
          avg_goals_per_match: 2.5,
          total_teams: 50,
          total_leagues: 5,
          high_scoring_matches: 150,
          clean_sheets: 200,
        },
        recent_matches: [
          { id: 1, home_team: 'Barcelona', away_team: 'Real Madrid' },
        ],
        charts: {
          goals_trend: { labels: [], datasets: [], type: 'line' },
        },
        last_updated: '2025-10-25T12:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboard,
      });

      const result = await apiService.getDashboardData();
      expect(result).toEqual(mockDashboard);
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/dashboard');
    });

    it('should handle league filter parameter', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await apiService.getDashboardData('Premier League');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/dashboard?league=Premier%20League'
      );
    });

    it('should include all 5 chart types in complete dashboard', async () => {
      const mockDashboard = {
        stats: {
          total_matches: 1000,
          total_goals: 2500,
          home_win_percentage: 44.5,
          away_win_percentage: 35.2,
          draw_percentage: 20.3,
          avg_goals_per_match: 2.5,
          total_teams: 50,
          total_leagues: 5,
          high_scoring_matches: 150,
          clean_sheets: 200,
        },
        recent_matches: [],
        charts: {
          goals_trend: { labels: [], datasets: [], type: 'line' },
          results_distribution: { labels: [], datasets: [], type: 'doughnut' },
          league_table: { labels: [], datasets: [], type: 'bar' },
          goal_distribution: { labels: [], datasets: [], type: 'bar' },
          team_performance: { labels: [], datasets: [], type: 'radar' },
        },
        last_updated: '2025-10-25T12:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboard,
      });

      const result = await apiService.getDashboardData();
      expect(result.charts).toBeDefined();
      expect(Object.keys(result.charts)).toHaveLength(5);
      expect(result.charts.goals_trend).toBeDefined();
      expect(result.charts.results_distribution).toBeDefined();
      expect(result.charts.league_table).toBeDefined();
      expect(result.charts.goal_distribution).toBeDefined();
      expect(result.charts.team_performance).toBeDefined();
    });

    it('should include clean_sheets in stats', async () => {
      const mockDashboard = {
        stats: {
          total_matches: 500,
          total_goals: 1200,
          home_win_percentage: 45.0,
          away_win_percentage: 30.0,
          draw_percentage: 25.0,
          avg_goals_per_match: 2.4,
          total_teams: 20,
          total_leagues: 1,
          high_scoring_matches: 75,
          clean_sheets: 120,
        },
        recent_matches: [],
        charts: {},
        last_updated: '2025-10-25T12:00:00Z',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboard,
      });

      const result = await apiService.getDashboardData();
      expect(result.stats.clean_sheets).toBe(120);
    });
  });

  describe('getDashboardMatches', () => {
    it('should fetch dashboard matches with default limit', async () => {
      const mockMatches = [
        { id: 1, home_team: 'Team A', away_team: 'Team B' },
        { id: 2, home_team: 'Team C', away_team: 'Team D' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMatches,
      });

      const result = await apiService.getDashboardMatches();
      expect(result).toEqual(mockMatches);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/dashboard/matches?limit=1000'
      );
    });

    it('should fetch matches with custom limit and league', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await apiService.getDashboardMatches(50, 'La Liga');
      // URLSearchParams encodes spaces as + not %20
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/dashboard/matches?limit=50&league=La+Liga'
      );
    });
  });

  describe('getDashboardStats', () => {
    it('should fetch dashboard statistics', async () => {
      const mockStats = {
        total_matches: 1000,
        total_goals: 2500,
        home_win_percentage: 44.5,
        away_win_percentage: 35.2,
        draw_percentage: 20.3,
        avg_goals_per_match: 2.5,
        total_teams: 50,
        total_leagues: 5,
        high_scoring_matches: 150,
        clean_sheets: 200,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await apiService.getDashboardStats();
      expect(result).toEqual(mockStats);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/dashboard/stats'
      );
    });

    it('should include clean_sheets field in stats', async () => {
      const mockStats = {
        total_matches: 500,
        total_goals: 1200,
        home_win_percentage: 45.0,
        away_win_percentage: 30.0,
        draw_percentage: 25.0,
        avg_goals_per_match: 2.4,
        total_teams: 20,
        total_leagues: 1,
        high_scoring_matches: 75,
        clean_sheets: 120,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await apiService.getDashboardStats();
      expect(result.clean_sheets).toBeDefined();
      expect(result.clean_sheets).toBe(120);
      expect(typeof result.clean_sheets).toBe('number');
    });

    it('should fetch stats with league filter', async () => {
      const mockStats = {
        total_matches: 380,
        total_goals: 950,
        home_win_percentage: 46.0,
        away_win_percentage: 28.0,
        draw_percentage: 26.0,
        avg_goals_per_match: 2.5,
        total_teams: 20,
        total_leagues: 1,
        high_scoring_matches: 60,
        clean_sheets: 95,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      await apiService.getDashboardStats('E0');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/dashboard/stats?league=E0'
      );
    });
  });

  describe('getChartData', () => {
    it('should fetch chart data for specific type', async () => {
      const mockChartData = {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [
          {
            label: 'Goals',
            data: [10, 15, 20],
            borderColor: '#4ade80',
          },
        ],
        type: 'line',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockChartData,
      });

      const result = await apiService.getChartData('goals_trend');
      expect(result).toEqual(mockChartData);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/dashboard/charts/goals_trend'
      );
    });

    it('should support league filter for charts', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ type: 'bar' }),
      });

      await apiService.getChartData('league_table', 'Bundesliga');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/dashboard/charts/league_table?league=Bundesliga'
      );
    });

    it('should fetch team performance radar chart with clean sheets', async () => {
      const mockRadarChart = {
        labels: ['Wins', 'Points/Game', 'Goals/Game', 'Clean Sheets', 'Form'],
        datasets: [
          {
            label: 'Barcelona',
            data: [20, 25, 30, 10, 15],
            borderColor: '#10b981',
            backgroundColor: '#10b98130',
          },
          {
            label: 'Real Madrid',
            data: [18, 24, 28, 8, 14],
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b30',
          },
        ],
        type: 'radar',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRadarChart,
      });

      const result = await apiService.getChartData('team_performance');
      expect(result).toEqual(mockRadarChart);
      expect(result.type).toBe('radar');
      expect(result.labels).toContain('Clean Sheets');
      expect(result.labels.length).toBe(5);
      expect(result.datasets.length).toBeLessThanOrEqual(6);
    });

    it('should fetch goal distribution histogram', async () => {
      const mockHistogram = {
        labels: ['0', '1', '2', '3', '4', '5', '6+'],
        datasets: [
          {
            label: 'Number of Matches',
            data: [50, 120, 150, 100, 60, 30, 20],
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: 'rgba(16, 185, 129, 1)',
          },
        ],
        type: 'bar',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistogram,
      });

      const result = await apiService.getChartData('goal_distribution');
      expect(result).toEqual(mockHistogram);
      expect(result.type).toBe('bar');
      expect(result.labels).toEqual(['0', '1', '2', '3', '4', '5', '6+']);
      expect(result.labels.length).toBe(7);
    });

    it('should fetch team performance with league filter', async () => {
      const mockChart = {
        type: 'radar',
        labels: ['Wins', 'Points/Game', 'Goals/Game', 'Clean Sheets', 'Form'],
        datasets: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockChart,
      });

      await apiService.getChartData('team_performance', 'E0');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/dashboard/charts/team_performance?league=E0'
      );
    });
  });

  describe('analyzeDashboard', () => {
    it('should analyze dashboard with RAG system', async () => {
      const mockAnalysis = {
        query: 'top scorers',
        analysis: 'Barcelona leads with most goals',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalysis,
      });

      const result = await apiService.analyzeDashboard('top scorers');
      expect(result).toEqual(mockAnalysis);
      // URLSearchParams encodes spaces as +
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/dashboard/analyze?query=top+scorers',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    });
  });

  describe('executeSQL', () => {
    it('should execute SQL query', async () => {
      const mockResults = {
        results: [
          { team: 'Barcelona', goals: 50 },
          { team: 'Real Madrid', goals: 48 },
        ],
        execution_time_ms: 125.5,
        rows_affected: 2,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      });

      const result = await apiService.executeSQL(
        'SELECT team, COUNT(*) as goals FROM matches GROUP BY team'
      );

      // executeSQL returns only the results array, not the full response object
      expect(result).toEqual(mockResults.results);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/execute',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: 'SELECT team, COUNT(*) as goals FROM matches GROUP BY team',
          }),
        }
      );
    });
  });

  describe('optimizeSQL', () => {
    it('should optimize SQL query', async () => {
      const mockOptimization = {
        original_sql: 'SELECT * FROM matches',
        optimized_sql: 'SELECT id, home_team, away_team FROM matches',
        improvements: ['Removed unnecessary columns'],
        estimated_performance_gain: '30%',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOptimization,
      });

      const result = await apiService.optimizeSQL({
        sql: 'SELECT * FROM matches',
      });

      expect(result).toEqual(mockOptimization);
    });
  });

  describe('discoverPatterns', () => {
    it('should discover patterns in data', async () => {
      const mockPatterns = {
        patterns: ['Home advantage detected', 'Goal scoring increases in second half'],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPatterns,
      });

      const result = await apiService.discoverPatterns({
        pattern_type: 'trends',
        season: '2023/24',
      });

      expect(result).toEqual(mockPatterns);
    });
  });

  describe('isAvailable', () => {
    it('should return true when backend is available', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy', rag_initialized: true }),
      });

      const result = await apiService.isAvailable();
      expect(result).toBe(true);
    });

    it('should return false when backend is not available', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Connection refused'));

      const result = await apiService.isAvailable();
      expect(result).toBe(false);
    });

    it('should handle timeout properly', async () => {
      // Mock fetch that rejects with abort error (simulating timeout)
      (global.fetch as any).mockImplementationOnce(
        () => Promise.reject(new Error('The operation was aborted'))
      );

      const result = await apiService.isAvailable();
      // Should return false when aborted/timed out
      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getDashboardData()).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiService.getDashboardData()).rejects.toThrow('Invalid JSON');
    });

    it('should handle 404 responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(apiService.getDashboardData()).rejects.toThrow(
        'Dashboard API request failed: Not Found'
      );
    });

    it('should handle 500 responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(apiService.getDashboardStats()).rejects.toThrow(
        'Stats API request failed: Internal Server Error'
      );
    });
  });

  describe('CORS', () => {
    it('should send requests with proper headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await apiService.executeSQL('SELECT 1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });
});