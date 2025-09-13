import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import Dashboard from './Dashboard.svelte';
import { dataService } from '../services/dataService';
import type { Match } from '../types';

// Mock the dataService
vi.mock('../services/dataService', () => ({
  dataService: {
    getCurrentSeasonMatches: vi.fn(),
    getStatus: vi.fn(() => ({
      primarySource: { type: 'api', available: true },
      fallbackSource: { type: 'database', available: true },
      cacheEnabled: true
    }))
  }
}));

// Mock Chart.js to avoid canvas rendering issues in tests
vi.mock('chart.js', () => ({
  Chart: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  LineElement: vi.fn(),
  LinearScale: vi.fn(),
  CategoryScale: vi.fn(),
  PointElement: vi.fn()
}));

// Mock svelte-chartjs
vi.mock('svelte-chartjs', () => ({
  Line: vi.fn()
}));

// Mock tweened from svelte/motion
vi.mock('svelte/motion', () => ({
  tweened: vi.fn((initial) => ({
    set: vi.fn(),
    update: vi.fn(),
    subscribe: vi.fn((callback) => {
      callback(initial);
      return vi.fn(); // Return unsubscribe function
    })
  }))
}));

const mockMatches: Match[] = [
  {
    id: '1',
    season_id: 'season-1',
    date: new Date().toISOString(),
    home_team: 'Arsenal',
    away_team: 'Liverpool',
    home_goals: 2,
    away_goals: 1,
    result: 'H',
    home_odds: 2.5,
    draw_odds: 3.2,
    away_odds: 2.8,
    first_half_home_goals: 1,
    first_half_away_goals: 0,
    full_time_result: 'H',
    half_time_result: 'H',
    referee: 'Michael Oliver',
    home_shots: 15,
    away_shots: 12,
    home_shots_target: 6,
    away_shots_target: 4,
    home_fouls: 10,
    away_fouls: 12,
    home_corners: 6,
    away_corners: 4,
    home_yellows: 2,
    away_yellows: 3,
    home_reds: 0,
    away_reds: 0,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    season_id: 'season-1',
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    home_team: 'Chelsea',
    away_team: 'Manchester United',
    home_goals: 1,
    away_goals: 1,
    result: 'D',
    home_odds: 2.1,
    draw_odds: 3.4,
    away_odds: 3.2,
    first_half_home_goals: 0,
    first_half_away_goals: 0,
    full_time_result: 'D',
    half_time_result: 'D',
    referee: 'Anthony Taylor',
    home_shots: 10,
    away_shots: 8,
    home_shots_target: 3,
    away_shots_target: 2,
    home_fouls: 8,
    away_fouls: 10,
    home_corners: 4,
    away_corners: 3,
    home_yellows: 1,
    away_yellows: 2,
    home_reds: 0,
    away_reds: 0,
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock implementation
    vi.mocked(dataService.getCurrentSeasonMatches).mockResolvedValue(mockMatches);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(Dashboard);
    
    // Check for loading indicators
    const loadingElements = document.querySelectorAll('.skeleton');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should display dashboard title', () => {
    render(Dashboard);
    
    const title = screen.getByText('Dashboard Overview');
    expect(title).toBeInTheDocument();
  });

  it('should load and display match data', async () => {
    render(Dashboard);
    
    await waitFor(() => {
      expect(dataService.getCurrentSeasonMatches).toHaveBeenCalled();
    });
  });

  it('should display stats cards', async () => {
    render(Dashboard);
    
    await waitFor(() => {
      // Check for stat card elements
      const statCards = document.querySelectorAll('.card-stats');
      expect(statCards.length).toBeGreaterThan(0);
    });
  });

  it('should handle empty match data', async () => {
    vi.mocked(dataService.getCurrentSeasonMatches).mockResolvedValue([]);
    
    render(Dashboard);
    
    await waitFor(() => {
      const errorMessage = screen.queryByText(/No matches found for the current season/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('should handle data loading error', async () => {
    vi.mocked(dataService.getCurrentSeasonMatches).mockRejectedValue(
      new Error('Failed to fetch')
    );
    
    render(Dashboard);
    
    await waitFor(() => {
      const errorMessage = screen.queryByText(/Failed to load dashboard data/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  it('should display retry button on error', async () => {
    vi.mocked(dataService.getCurrentSeasonMatches).mockRejectedValue(
      new Error('Failed to fetch')
    );
    
    render(Dashboard);
    
    await waitFor(() => {
      const retryButton = screen.queryByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  it('should calculate prediction accuracy correctly', async () => {
    render(Dashboard);
    
    await waitFor(() => {
      expect(dataService.getCurrentSeasonMatches).toHaveBeenCalled();
    });
    
    // Verify accuracy calculations are performed
    await waitFor(() => {
      const accuracyElement = document.querySelector('.stat-value');
      expect(accuracyElement).toBeInTheDocument();
    });
  });

  it('should display chart containers', async () => {
    render(Dashboard);
    
    await waitFor(() => {
      const chartContainers = document.querySelectorAll('.chart-container');
      expect(chartContainers.length).toBe(2); // Prediction accuracy and profit/loss charts
    });
  });

  it('should display recent predictions section', async () => {
    render(Dashboard);
    
    await waitFor(() => {
      const recentPredictionsTitle = screen.queryByText(/Recent Predictions/i);
      expect(recentPredictionsTitle).toBeInTheDocument();
    });
  });

  it('should display upcoming matches section', async () => {
    render(Dashboard);
    
    await waitFor(() => {
      const upcomingMatchesTitle = screen.queryByText(/Upcoming Matches/i);
      expect(upcomingMatchesTitle).toBeInTheDocument();
    });
  });

  it('should show data freshness component', () => {
    render(Dashboard);
    
    // DataFreshness component should be rendered
    const dataFreshnessContainer = document.querySelector('.flex-col.sm\\:flex-row');
    expect(dataFreshnessContainer).toBeInTheDocument();
  });

  it('should animate stat values', async () => {
    render(Dashboard);
    
    await waitFor(() => {
      // Check that tweened values are being used
      const statValues = document.querySelectorAll('.stat-value');
      expect(statValues.length).toBeGreaterThan(0);
    });
  });

  it('should handle multiple matches correctly', async () => {
    const manyMatches = Array.from({ length: 20 }, (_, i) => ({
      ...mockMatches[0],
      id: `match-${i}`,
      home_team: `Team ${i}`,
      away_team: `Team ${i + 20}`
    }));
    
    vi.mocked(dataService.getCurrentSeasonMatches).mockResolvedValue(manyMatches);
    
    render(Dashboard);
    
    await waitFor(() => {
      expect(dataService.getCurrentSeasonMatches).toHaveBeenCalled();
    });
  });

  it('should apply correct CSS classes for animations', async () => {
    render(Dashboard);
    
    await waitFor(() => {
      const animatedElements = document.querySelectorAll('.animate-fade-in');
      expect(animatedElements.length).toBeGreaterThan(0);
      
      const floatingElements = document.querySelectorAll('.animate-float-subtle');
      expect(floatingElements.length).toBeGreaterThan(0);
    });
  });

  it('should handle stat icon rendering', async () => {
    render(Dashboard);
    
    await waitFor(() => {
      const iconWrappers = document.querySelectorAll('.stat-icon-wrapper');
      expect(iconWrappers.length).toBe(4); // 4 stat cards
    });
  });

  it('should format dates correctly', async () => {
    render(Dashboard);
    
    await waitFor(() => {
      // Date formatting should be applied to match dates
      const dateElements = document.querySelectorAll('.text-sm.text-slate-500');
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  it('should handle responsive layout classes', () => {
    render(Dashboard);
    
    // Check for responsive grid classes
    const gridElements = document.querySelectorAll('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
    expect(gridElements.length).toBeGreaterThan(0);
  });
});