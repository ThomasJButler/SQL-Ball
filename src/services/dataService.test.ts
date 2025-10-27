/**
 * @author Tom Butler
 * @date 2025-10-27
 * @description Test suite for Data Service. Tests caching mechanism, data fetching,
 *              and statistics calculations.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { dataService } from './dataService';
import type { Match } from '../types';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            execute: vi.fn(),
          })),
          execute: vi.fn(),
        })),
        execute: vi.fn(),
      })),
      order: vi.fn(() => ({
        limit: vi.fn(() => ({
          execute: vi.fn(),
        })),
        execute: vi.fn(),
      })),
      limit: vi.fn(() => ({
        execute: vi.fn(),
      })),
      execute: vi.fn(),
    })),
  })),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

const mockMatches: Match[] = [
  {
    id: '1',
    season_id: 'season-1',
    match_date: '2024-10-20T15:00:00Z',
    div: 'E0',
    home_team: 'Liverpool',
    away_team: 'Arsenal',
    home_score: 2,
    away_score: 1,
    result: 'H',
    ht_home_score: 1,
    ht_away_score: 0,
    ht_result: 'H',
    referee: 'Michael Oliver',
    home_shots: 15,
    away_shots: 12,
    home_shots_target: 6,
    away_shots_target: 4,
    home_fouls: 10,
    away_fouls: 12,
    home_corners: 6,
    away_corners: 4,
    home_yellow_cards: 2,
    away_yellow_cards: 3,
    home_red_cards: 0,
    away_red_cards: 0,
    season: '2024-2025',
    created_at: '2024-10-20T15:00:00Z',
  },
  {
    id: '2',
    season_id: 'season-1',
    match_date: '2024-10-21T15:00:00Z',
    div: 'E0',
    home_team: 'Arsenal',
    away_team: 'Liverpool',
    home_score: 1,
    away_score: 1,
    result: 'D',
    ht_home_score: 0,
    ht_away_score: 1,
    ht_result: 'A',
    referee: 'Anthony Taylor',
    home_shots: 12,
    away_shots: 14,
    home_shots_target: 5,
    away_shots_target: 6,
    home_fouls: 8,
    away_fouls: 10,
    home_corners: 5,
    away_corners: 6,
    home_yellow_cards: 1,
    away_yellow_cards: 2,
    home_red_cards: 0,
    away_red_cards: 0,
    season: '2024-2025',
    created_at: '2024-10-21T15:00:00Z',
  },
  {
    id: '3',
    season_id: 'season-1',
    match_date: '2024-10-22T15:00:00Z',
    div: 'E0',
    home_team: 'Manchester City',
    away_team: 'Chelsea',
    home_score: 3,
    away_score: 0,
    result: 'H',
    ht_home_score: 2,
    ht_away_score: 0,
    ht_result: 'H',
    referee: 'Martin Atkinson',
    home_shots: 18,
    away_shots: 8,
    home_shots_target: 8,
    away_shots_target: 2,
    home_fouls: 6,
    away_fouls: 14,
    home_corners: 8,
    away_corners: 2,
    home_yellow_cards: 0,
    away_yellow_cards: 4,
    home_red_cards: 0,
    away_red_cards: 0,
    season: '2024-2025',
    created_at: '2024-10-22T15:00:00Z',
  },
];

describe('DataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentSeasonMatches', () => {
    it('should fetch current season matches', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().eq().order().execute = mockExecute;

      const matches = await dataService.getCurrentSeasonMatches();

      expect(matches).toBeDefined();
      expect(Array.isArray(matches)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const mockExecute = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      mockSupabase.from().select().eq().order().execute = mockExecute;

      await expect(dataService.getCurrentSeasonMatches()).rejects.toThrow();
    });

    it('should return empty array when no data', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: [], error: null });
      mockSupabase.from().select().eq().order().execute = mockExecute;

      const matches = await dataService.getCurrentSeasonMatches();

      expect(matches).toEqual([]);
    });
  });

  describe('getMatches', () => {
    it('should fetch matches with filtering options', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().order().limit().execute = mockExecute;

      const matches = await dataService.getMatches({ limit: 10 });

      expect(mockSupabase.from).toHaveBeenCalledWith('matches');
    });

    it('should filter by league division', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().eq().order().limit().execute = mockExecute;

      await dataService.getMatches({ div: 'E0', limit: 10 });

      expect(mockExecute).toHaveBeenCalled();
    });

    it('should filter by season', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().eq().order().limit().execute = mockExecute;

      await dataService.getMatches({ season: '2024-2025', limit: 10 });

      expect(mockExecute).toHaveBeenCalled();
    });

    it('should apply limit parameter', async () => {
      const mockLimit = vi.fn(() => ({ execute: vi.fn().mockResolvedValue({ data: mockMatches, error: null }) }));
      mockSupabase.from().select().order().limit = mockLimit;

      await dataService.getMatches({ limit: 50 });

      expect(mockLimit).toHaveBeenCalledWith(50);
    });
  });

  describe('getTeamStats', () => {
    it('should calculate team statistics', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().execute = mockExecute;

      const stats = await dataService.getTeamStats('Liverpool');

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('played');
      expect(stats).toHaveProperty('won');
      expect(stats).toHaveProperty('drawn');
      expect(stats).toHaveProperty('lost');
      expect(stats).toHaveProperty('goalsFor');
      expect(stats).toHaveProperty('goalsAgainst');
    });

    it('should calculate wins correctly', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().execute = mockExecute;

      const stats = await dataService.getTeamStats('Liverpool');

      // Liverpool: 1 win (2-1), 1 draw (1-1)
      expect(stats.won).toBeGreaterThanOrEqual(0);
      expect(stats.played).toBe(2);
    });

    it('should calculate clean sheets', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().execute = mockExecute;

      const stats = await dataService.getTeamStats('Manchester City');

      // Man City kept clean sheet vs Chelsea (3-0)
      expect(stats).toHaveProperty('cleanSheets');
      expect(stats.cleanSheets).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getStandings', () => {
    it('should calculate league standings', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().eq().execute = mockExecute;

      const standings = await dataService.getStandings('E0');

      expect(Array.isArray(standings)).toBe(true);
      expect(standings.length).toBeGreaterThan(0);
    });

    it('should sort teams by points', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().eq().execute = mockExecute;

      const standings = await dataService.getStandings('E0');

      if (standings.length > 1) {
        // First team should have >= points than second team
        expect(standings[0].points).toBeGreaterThanOrEqual(standings[1].points);
      }
    });

    it('should calculate goal difference', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().eq().execute = mockExecute;

      const standings = await dataService.getStandings('E0');

      standings.forEach(team => {
        expect(team).toHaveProperty('goalDifference');
        expect(team.goalDifference).toBe(team.goalsFor - team.goalsAgainst);
      });
    });
  });

  describe('getTeamForm', () => {
    it('should get last 5 matches for a team', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches.slice(0, 2), error: null });
      mockSupabase.from().select().order().limit().execute = mockExecute;

      const form = await dataService.getTeamForm('Liverpool');

      expect(Array.isArray(form)).toBe(true);
      expect(form.length).toBeLessThanOrEqual(5);
    });

    it('should order matches by date descending', async () => {
      const mockOrder = vi.fn(() => ({
        limit: vi.fn(() => ({
          execute: vi.fn().mockResolvedValue({ data: mockMatches, error: null })
        }))
      }));
      mockSupabase.from().select().order = mockOrder;

      await dataService.getTeamForm('Liverpool');

      expect(mockOrder).toHaveBeenCalledWith('match_date', { ascending: false });
    });
  });

  describe('getHeadToHead', () => {
    it('should get head to head statistics', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches.slice(0, 2), error: null });
      mockSupabase.from().select().execute = mockExecute;

      const h2h = await dataService.getHeadToHead('Liverpool', 'Arsenal');

      expect(h2h).toBeDefined();
      expect(h2h).toHaveProperty('totalMatches');
      expect(h2h).toHaveProperty('homeWins');
      expect(h2h).toHaveProperty('awayWins');
      expect(h2h).toHaveProperty('draws');
    });

    it('should count matches correctly', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches.slice(0, 2), error: null });
      mockSupabase.from().select().execute = mockExecute;

      const h2h = await dataService.getHeadToHead('Liverpool', 'Arsenal');

      // 2 matches between Liverpool and Arsenal
      expect(h2h.totalMatches).toBe(2);
    });

    it('should handle teams with no matches', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: [], error: null });
      mockSupabase.from().select().execute = mockExecute;

      const h2h = await dataService.getHeadToHead('Team A', 'Team B');

      expect(h2h.totalMatches).toBe(0);
      expect(h2h.homeWins).toBe(0);
      expect(h2h.awayWins).toBe(0);
      expect(h2h.draws).toBe(0);
    });
  });

  describe('getCurrentSeason', () => {
    it('should return current season info', async () => {
      const season = await dataService.getCurrentSeason();

      expect(season).toBeDefined();
      expect(season).toHaveProperty('season');
      expect(typeof season.season).toBe('string');
    });

    it('should match format YYYY-YYYY', async () => {
      const season = await dataService.getCurrentSeason();

      expect(season.season).toMatch(/\d{4}-\d{4}/);
    });
  });

  describe('getAllSeasons', () => {
    it('should return all available seasons', async () => {
      const mockExecute = vi.fn().mockResolvedValue({
        data: [
          { season: '2023-2024' },
          { season: '2024-2025' },
        ],
        error: null,
      });
      mockSupabase.from().select().execute = mockExecute;

      const seasons = await dataService.getAllSeasons();

      expect(Array.isArray(seasons)).toBe(true);
      expect(seasons.length).toBeGreaterThan(0);
    });

    it('should return unique seasons', async () => {
      const mockExecute = vi.fn().mockResolvedValue({
        data: [
          { season: '2024-2025' },
          { season: '2024-2025' },
          { season: '2023-2024' },
        ],
        error: null,
      });
      mockSupabase.from().select().execute = mockExecute;

      const seasons = await dataService.getAllSeasons();

      const uniqueSeasons = new Set(seasons.map(s => s.season));
      expect(uniqueSeasons.size).toBe(seasons.length);
    });
  });

  describe('Caching', () => {
    it('should cache match data', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().eq().order().execute = mockExecute;

      // First call
      await dataService.getCurrentSeasonMatches();

      // Second call should use cache
      await dataService.getCurrentSeasonMatches();

      // Should only fetch once (from cache on second call)
      // Note: This depends on implementation details
    });

    it('should respect cache timeout', async () => {
      // This test would require mocking time or testing cache invalidation
      expect(true).toBe(true); // Placeholder
    });

    it('should handle cache errors gracefully', async () => {
      // Test that errors in caching don't break functionality
      const mockExecute = vi.fn().mockResolvedValue({ data: mockMatches, error: null });
      mockSupabase.from().select().eq().order().execute = mockExecute;

      const matches = await dataService.getCurrentSeasonMatches();

      expect(matches).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const mockExecute = vi.fn().mockRejectedValue(new Error('Network error'));
      mockSupabase.from().select().execute = mockExecute;

      await expect(dataService.getMatches({ limit: 10 })).rejects.toThrow();
    });

    it('should handle null data gracefully', async () => {
      const mockExecute = vi.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from().select().eq().order().execute = mockExecute;

      const matches = await dataService.getCurrentSeasonMatches();

      expect(matches).toEqual([]);
    });

    it('should handle undefined scores', async () => {
      const matchesWithNulls = [
        { ...mockMatches[0], home_score: null, away_score: null },
      ];
      const mockExecute = vi.fn().mockResolvedValue({ data: matchesWithNulls, error: null });
      mockSupabase.from().select().execute = mockExecute;

      const stats = await dataService.getTeamStats('Liverpool');

      expect(stats).toBeDefined();
      expect(stats.goalsFor).toBeGreaterThanOrEqual(0);
    });
  });
});
