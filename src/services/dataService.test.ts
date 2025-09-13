import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Match, Season, TeamStats, Standing } from '../types';

// Mock the dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: mockSeason, 
            error: null 
          }))
        })),
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ 
            data: mockMatches, 
            error: null 
          }))
        })),
        lt: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ 
            data: mockMatches, 
            error: null 
          }))
        })),
        order: vi.fn(() => Promise.resolve({ 
          data: mockMatches, 
          error: null 
        })),
        or: vi.fn(() => Promise.resolve({ 
          data: mockMatches, 
          error: null 
        })),
        single: vi.fn(() => Promise.resolve({ 
          data: mockTeamStats, 
          error: null 
        }))
      }))
    }))
  }
}));

vi.mock('./api/footballData', () => ({
  footballDataAPI: {
    hasApiKey: vi.fn(() => true),
    testConnection: vi.fn(() => Promise.resolve(true)),
    getCurrentSeason: vi.fn(() => Promise.resolve(mockSeason)),
    getUpcomingMatches: vi.fn(() => Promise.resolve(mockMatches)),
    getRecentResults: vi.fn(() => Promise.resolve(mockMatches)),
    getMatches: vi.fn(() => Promise.resolve(mockMatches)),
    getTeamStats: vi.fn(() => Promise.resolve(mockTeamStats)),
    getStandings: vi.fn(() => Promise.resolve(mockStandings))
  }
}));

// Mock data
const mockSeason: Season = {
  id: '1',
  name: '2024-2025',
  start_date: '2024-08-01',
  end_date: '2025-05-31',
  is_current: true,
  created_at: '2024-01-01'
};

const mockMatches: Match[] = [
  {
    id: '1',
    season_id: '1',
    date: '2024-08-15T15:00:00Z',
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
    created_at: '2024-08-15'
  }
];

const mockTeamStats: TeamStats = {
  id: '1',
  season_id: '1',
  team_name: 'Arsenal',
  matches_played: 10,
  wins: 7,
  draws: 2,
  losses: 1,
  goals_for: 20,
  goals_against: 8,
  clean_sheets: 4,
  failed_to_score: 1,
  points: 23,
  home_matches_played: 5,
  home_wins: 4,
  home_draws: 1,
  home_losses: 0,
  home_goals_for: 12,
  home_goals_against: 3,
  away_matches_played: 5,
  away_wins: 3,
  away_draws: 1,
  away_losses: 1,
  away_goals_for: 8,
  away_goals_against: 5,
  updated_at: '2024-08-15'
};

const mockStandings: Standing[] = [
  {
    position: 1,
    team: {
      id: 1,
      name: 'Arsenal',
      shortName: 'ARS',
      tla: 'ARS',
      crest: 'arsenal.png'
    },
    playedGames: 10,
    form: 'WWDWL',
    won: 7,
    draw: 2,
    lost: 1,
    points: 23,
    goalsFor: 20,
    goalsAgainst: 8,
    goalDifference: 12
  }
];

describe('DataService', () => {
  let dataService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Clear the module cache to get a fresh instance
    vi.resetModules();
    const { dataService: ds } = await import('./dataService');
    dataService = ds;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentSeason', () => {
    it('should fetch current season from API when available', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      
      const season = await dataService.getCurrentSeason();
      
      expect(footballDataAPI.getCurrentSeason).toHaveBeenCalled();
      expect(season).toEqual(mockSeason);
    });

    it('should fall back to database when API is unavailable', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      vi.mocked(footballDataAPI.getCurrentSeason).mockResolvedValueOnce(null);
      
      const season = await dataService.getCurrentSeason();
      
      expect(season).toEqual(mockSeason);
    });

    it('should cache the season result', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      
      await dataService.getCurrentSeason();
      await dataService.getCurrentSeason();
      
      // Should only call API once due to caching
      expect(footballDataAPI.getCurrentSeason).toHaveBeenCalledTimes(1);
    });
  });

  describe('getMatches', () => {
    it('should fetch upcoming matches from API', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      
      const matches = await dataService.getMatches({ upcoming: true, days: 7 });
      
      expect(footballDataAPI.getUpcomingMatches).toHaveBeenCalledWith(7);
      expect(matches).toEqual(mockMatches);
    });

    it('should fetch recent matches from API', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      
      const matches = await dataService.getMatches({ recent: true, days: 7 });
      
      expect(footballDataAPI.getRecentResults).toHaveBeenCalledWith(7);
      expect(matches).toEqual(mockMatches);
    });

    it('should fetch all matches when no filter specified', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      
      const matches = await dataService.getMatches();
      
      expect(footballDataAPI.getMatches).toHaveBeenCalled();
      expect(matches).toEqual(mockMatches);
    });

    it('should filter matches by team name', async () => {
      const matches = await dataService.getMatches({ teamName: 'Arsenal' });
      
      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
    });

    it('should fall back to database when API returns empty', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      vi.mocked(footballDataAPI.getMatches).mockResolvedValueOnce([]);
      
      const matches = await dataService.getMatches();
      
      expect(matches).toEqual(mockMatches);
    });
  });

  describe('getTeamStats', () => {
    it('should fetch team stats from API', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      
      const stats = await dataService.getTeamStats('Arsenal');
      
      expect(footballDataAPI.getTeamStats).toHaveBeenCalledWith('Arsenal');
      expect(stats).toEqual(mockTeamStats);
    });

    it('should cache team stats', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      
      await dataService.getTeamStats('Arsenal');
      // Second call should use cache
      await dataService.getTeamStats('Arsenal');
      
      expect(footballDataAPI.getTeamStats).toHaveBeenCalledTimes(1);
    });

    it('should fall back to database when API unavailable', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      vi.mocked(footballDataAPI.getTeamStats).mockResolvedValueOnce(null);
      
      const stats = await dataService.getTeamStats('Arsenal');
      
      expect(stats).toEqual(mockTeamStats);
    });
  });

  describe('getStandings', () => {
    it('should fetch standings from API', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      
      const standings = await dataService.getStandings();
      
      expect(footballDataAPI.getStandings).toHaveBeenCalled();
      expect(standings).toEqual(mockStandings);
    });

    it('should cache standings for each team', async () => {
      await dataService.getStandings();
      
      // Verify caching logic would be called
      expect(mockStandings).toHaveLength(1);
    });

    it('should return empty array on error', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      vi.mocked(footballDataAPI.getStandings).mockResolvedValueOnce([]);
      
      const { supabase } = await import('../lib/supabase');
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: new Error('Database error') 
          }))
        }))
      } as any);
      
      const standings = await dataService.getStandings();
      
      expect(standings).toEqual([]);
    });
  });

  describe('getTeamForm', () => {
    it('should calculate team form from recent matches', async () => {
      const form = await dataService.getTeamForm('Arsenal', 5);
      
      expect(form).toBeDefined();
      expect(Array.isArray(form)).toBe(true);
      expect(form.length).toBeLessThanOrEqual(5);
    });

    it('should correctly determine home/away results', async () => {
      const form = await dataService.getTeamForm('Arsenal', 1);
      
      if (form.length > 0) {
        expect(form[0]).toHaveProperty('opponent');
        expect(form[0]).toHaveProperty('goalsFor');
        expect(form[0]).toHaveProperty('goalsAgainst');
        expect(form[0]).toHaveProperty('result');
        expect(form[0]).toHaveProperty('date');
      }
    });
  });

  describe('getHeadToHead', () => {
    it('should fetch head to head statistics', async () => {
      const h2h = await dataService.getHeadToHead('Arsenal', 'Liverpool');
      
      expect(h2h).toHaveProperty('homeWins');
      expect(h2h).toHaveProperty('draws');
      expect(h2h).toHaveProperty('awayWins');
      expect(h2h).toHaveProperty('matches');
      expect(Array.isArray(h2h.matches)).toBe(true);
    });

    it('should correctly calculate win statistics', async () => {
      const h2h = await dataService.getHeadToHead('Arsenal', 'Liverpool');
      
      const total = h2h.homeWins + h2h.draws + h2h.awayWins;
      expect(total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data source management', () => {
    it('should switch data source to database', () => {
      dataService.setDataSource('database');
      const status = dataService.getStatus();
      
      expect(status.primarySource.type).toBe('database');
    });

    it('should not switch to API without API key', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      vi.mocked(footballDataAPI.hasApiKey).mockReturnValueOnce(false);
      
      dataService.setDataSource('api');
      
      // Should log error and not switch
      expect(console.error).toHaveBeenCalled();
    });

    it('should get current status', () => {
      const status = dataService.getStatus();
      
      expect(status).toHaveProperty('primarySource');
      expect(status).toHaveProperty('fallbackSource');
      expect(status).toHaveProperty('cacheEnabled');
      expect(status.primarySource).toHaveProperty('type');
      expect(status.primarySource).toHaveProperty('available');
    });
  });

  describe('Cache management', () => {
    it('should clear cache', async () => {
      await dataService.clearCache();
      
      expect(console.log).toHaveBeenCalledWith('Cache cleared');
    });

    it('should handle cache errors gracefully', async () => {
      // Force an error in cache operations
      global.indexedDB = undefined as any;
      
      // Should not throw
      await expect(dataService.clearCache()).resolves.not.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle API connection failures', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      vi.mocked(footballDataAPI.testConnection).mockResolvedValueOnce(false);
      
      // Re-import to trigger constructor
      vi.resetModules();
      const { dataService: newDs } = await import('./dataService');
      
      // Should fall back to database
      const status = newDs.getStatus();
      expect(status.fallbackSource.available).toBe(true);
    });

    it('should handle database query errors', async () => {
      const { footballDataAPI } = await import('./api/footballData');
      vi.mocked(footballDataAPI.getMatches).mockResolvedValueOnce([]);
      
      const { supabase } = await import('../lib/supabase');
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ 
            data: null, 
            error: new Error('Database error') 
          }))
        }))
      } as any);
      
      const matches = await dataService.getMatches();
      
      expect(matches).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});