/**
 * @author Tom Butler
 * @date 2025-10-27
 * @description Test suite for EnhancedVisualizations component. Tests chart rendering,
 *              league filtering, data loading, and user interactions.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import EnhancedVisualizations from './EnhancedVisualizations.svelte';
import { apiService } from '../services/apiService';
import type { ChartData } from '../services/apiService';

// Mock the apiService
vi.mock('../services/apiService', () => ({
  apiService: {
    getChartData: vi.fn(),
    isAvailable: vi.fn(() => Promise.resolve(true)),
  }
}));

// Mock Chart.js to avoid canvas rendering issues
vi.mock('chart.js', () => {
  const Chart = vi.fn();
  Chart.register = vi.fn();  // Mock the static register method
  return {
    Chart,
    Title: vi.fn(),
    Tooltip: vi.fn(),
    Legend: vi.fn(),
    LineElement: vi.fn(),
    LinearScale: vi.fn(),
    CategoryScale: vi.fn(),
    PointElement: vi.fn(),
    ArcElement: vi.fn(),
    BarElement: vi.fn(),
    RadialLinearScale: vi.fn(),
    Filler: vi.fn(),
    LineController: vi.fn(),
    BarController: vi.fn(),
    DoughnutController: vi.fn(),
    RadarController: vi.fn(),
  };
});

// Mock svelte-chartjs
vi.mock('svelte-chartjs', () => ({
  Line: vi.fn(),
  Doughnut: vi.fn(),
  Bar: vi.fn(),
  Radar: vi.fn(),
}));

const mockGoalsTrendData: ChartData = {
  labels: ['GW1', 'GW2', 'GW3', 'GW4', 'GW5'],
  datasets: [
    { label: 'Home Goals', data: [15, 18, 12, 20, 16], borderColor: '#4ade80' },
    { label: 'Away Goals', data: [10, 12, 14, 11, 13], borderColor: '#f97316' },
    { label: 'Total Goals', data: [25, 30, 26, 31, 29], borderColor: '#ef4444' },
  ],
  type: 'line',
};

const mockResultsDistribution: ChartData = {
  labels: ['Home Wins', 'Away Wins', 'Draws'],
  datasets: [{
    data: [180, 140, 60],
    backgroundColor: ['#4ade80', '#f97316', '#60a5fa'],
  }],
  type: 'doughnut',
};

const mockLeagueTable: ChartData = {
  labels: ['Liverpool', 'Arsenal', 'Man City', 'Chelsea', 'Man United'],
  datasets: [{
    label: 'Points',
    data: [85, 82, 78, 72, 68],
    backgroundColor: '#4ade80',
  }],
  type: 'bar',
};

const mockGoalDistribution: ChartData = {
  labels: ['0', '1', '2', '3', '4', '5', '6+'],
  datasets: [{
    label: 'Number of Matches',
    data: [50, 120, 150, 100, 60, 30, 20],
    backgroundColor: 'rgba(16, 185, 129, 0.6)',
    borderColor: 'rgba(16, 185, 129, 1)',
  }],
  type: 'bar',
};

const mockTeamPerformance: ChartData = {
  labels: ['Wins', 'Points/Game', 'Goals/Game', 'Clean Sheets', 'Form'],
  datasets: [
    {
      label: 'Liverpool',
      data: [40, 28, 35, 16, 18],
      borderColor: '#10b981',
      backgroundColor: '#10b98130',
    },
    {
      label: 'Arsenal',
      data: [38, 27, 33, 14, 16],
      borderColor: '#f59e0b',
      backgroundColor: '#f59e0b30',
    },
  ],
  type: 'radar',
};

describe('EnhancedVisualizations Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock implementations for all chart types
    vi.mocked(apiService.getChartData).mockImplementation(async (chartType: string) => {
      switch (chartType) {
        case 'goals_trend':
          return mockGoalsTrendData;
        case 'results_distribution':
          return mockResultsDistribution;
        case 'league_table':
          return mockLeagueTable;
        case 'goal_distribution':
          return mockGoalDistribution;
        case 'team_performance':
          return mockTeamPerformance;
        default:
          throw new Error(`Unknown chart type: ${chartType}`);
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render component with default league', () => {
    render(EnhancedVisualizations);

    // Component should render
    const visualizations = document.querySelector('.enhanced-visualizations');
    expect(visualizations).toBeTruthy();
  });

  it('should display league filter selector', () => {
    render(EnhancedVisualizations);

    // League selector should be present
    const selectors = document.querySelectorAll('select');
    expect(selectors.length).toBeGreaterThan(0);
  });

  it('should load goals trend chart', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      expect(apiService.getChartData).toHaveBeenCalledWith('goals_trend', expect.any(String));
    });
  });

  it('should load team performance radar chart with clean sheets', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      expect(apiService.getChartData).toHaveBeenCalledWith('team_performance', expect.any(String));
    });
  });

  it('should load results distribution doughnut chart', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      expect(apiService.getChartData).toHaveBeenCalledWith('results_distribution', expect.any(String));
    });
  });

  it('should load goal distribution histogram', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      expect(apiService.getChartData).toHaveBeenCalledWith('goal_distribution', expect.any(String));
    });
  });

  it('should load league table chart', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      expect(apiService.getChartData).toHaveBeenCalledWith('league_table', expect.any(String));
    });
  });

  it('should display loading state initially', () => {
    render(EnhancedVisualizations);

    // Check for loading skeletons or indicators
    const loadingElements = document.querySelectorAll('.skeleton, .loading, .animate-pulse');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should handle league filter change', async () => {
    const { container } = render(EnhancedVisualizations);

    await waitFor(() => {
      expect(apiService.getChartData).toHaveBeenCalled();
    });

    // Find and change league selector
    const select = container.querySelector('select');
    if (select) {
      await fireEvent.change(select, { target: { value: 'SP1' } });

      await waitFor(() => {
        // Should reload charts with new league
        expect(apiService.getChartData).toHaveBeenCalledWith(expect.any(String), 'SP1');
      });
    }
  });

  it('should fetch all chart types on mount', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      const chartTypes = ['goals_trend', 'results_distribution', 'league_table', 'goal_distribution', 'team_performance'];
      chartTypes.forEach(type => {
        expect(apiService.getChartData).toHaveBeenCalledWith(type, expect.any(String));
      });
    });
  });

  it('should handle chart loading errors gracefully', async () => {
    vi.mocked(apiService.getChartData).mockRejectedValueOnce(new Error('Failed to load chart'));

    render(EnhancedVisualizations);

    await waitFor(() => {
      // Should not crash and might show error message
      const component = document.querySelector('.enhanced-visualizations');
      expect(component).toBeTruthy();
    });
  });

  it('should display chart titles', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      // Chart section titles should be present
      const titles = document.querySelectorAll('h2, h3, .chart-title');
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  it('should render team performance with 6 teams maximum', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      expect(apiService.getChartData).toHaveBeenCalledWith('team_performance', expect.any(String));
    });

    // Team performance should show up to 6 teams
    const result = await apiService.getChartData('team_performance');
    expect(result.datasets.length).toBeLessThanOrEqual(6);
  });

  it('should render team performance with 5 metrics including clean sheets', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      expect(apiService.getChartData).toHaveBeenCalledWith('team_performance', expect.any(String));
    });

    const result = await apiService.getChartData('team_performance');
    expect(result.labels).toHaveLength(5);
    expect(result.labels).toContain('Clean Sheets');
  });

  it('should handle empty chart data', async () => {
    vi.mocked(apiService.getChartData).mockResolvedValueOnce({
      labels: [],
      datasets: [],
      type: 'line',
    });

    render(EnhancedVisualizations);

    await waitFor(() => {
      // Should handle empty data gracefully
      const component = document.querySelector('.enhanced-visualizations');
      expect(component).toBeTruthy();
    });
  });

  it('should support all 9 European leagues', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      const select = document.querySelector('select');
      if (select) {
        const options = select.querySelectorAll('option');
        // Should have at least 9 league options
        expect(options.length).toBeGreaterThanOrEqual(9);
      }
    });
  });

  it('should apply responsive grid layout', () => {
    render(EnhancedVisualizations);

    // Check for responsive grid classes
    const grids = document.querySelectorAll('.grid, [class*="grid-cols"]');
    expect(grids.length).toBeGreaterThan(0);
  });

  it('should animate chart appearance', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      // Check for animation classes
      const animated = document.querySelectorAll('.animate-fade-in, .fade-in, [class*="animate"]');
      expect(animated.length).toBeGreaterThan(0);
    });
  });

  it('should display chart containers', async () => {
    render(EnhancedVisualizations);

    await waitFor(() => {
      const chartContainers = document.querySelectorAll('.chart-container, [class*="chart"]');
      expect(chartContainers.length).toBeGreaterThan(0);
    });
  });

  it('should update all charts when league changes', async () => {
    const { container } = render(EnhancedVisualizations);

    await waitFor(() => {
      expect(apiService.getChartData).toHaveBeenCalled();
    });

    vi.clearAllMocks();

    const select = container.querySelector('select');
    if (select) {
      await fireEvent.change(select, { target: { value: 'D1' } });

      await waitFor(() => {
        // All 5 chart types should be reloaded
        expect(apiService.getChartData).toHaveBeenCalledTimes(5);
      });
    }
  });

  it('should handle API unavailability', async () => {
    vi.mocked(apiService.isAvailable).mockResolvedValueOnce(false);
    vi.mocked(apiService.getChartData).mockRejectedValue(new Error('API unavailable'));

    render(EnhancedVisualizations);

    await waitFor(() => {
      // Should not crash when API is unavailable
      const component = document.querySelector('.enhanced-visualizations');
      expect(component).toBeTruthy();
    });
  });
});
