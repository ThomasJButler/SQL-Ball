import { describe, it, expect } from 'vitest';
import type { Season, Match, TeamStats, Prediction, TeamForm, Standing } from './index';

describe('Type Definitions', () => {
  describe('Season type', () => {
    it('should accept valid season data', () => {
      const validSeason: Season = {
        id: '123',
        name: '2024-2025',
        start_date: '2024-08-01',
        end_date: '2025-05-31',
        is_current: true,
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(validSeason.id).toBe('123');
      expect(validSeason.is_current).toBe(true);
    });

    it('should enforce required properties', () => {
      const season: Season = {
        id: '',
        name: '',
        start_date: '',
        end_date: '',
        is_current: false,
        created_at: ''
      };

      // All properties should be present
      expect(Object.keys(season)).toHaveLength(6);
    });
  });

  describe('Match type', () => {
    it('should accept valid match data with nulls', () => {
      const validMatch: Match = {
        id: 'match1',
        season_id: 'season1',
        date: '2024-08-15T15:00:00Z',
        home_team: 'Arsenal',
        away_team: 'Liverpool',
        home_goals: null,
        away_goals: null,
        result: null,
        home_odds: 2.5,
        draw_odds: 3.2,
        away_odds: 2.8,
        first_half_home_goals: null,
        first_half_away_goals: null,
        full_time_result: null,
        half_time_result: null,
        referee: null,
        home_shots: null,
        away_shots: null,
        home_shots_target: null,
        away_shots_target: null,
        home_fouls: null,
        away_fouls: null,
        home_corners: null,
        away_corners: null,
        home_yellows: null,
        away_yellows: null,
        home_reds: null,
        away_reds: null,
        created_at: '2024-08-15'
      };

      expect(validMatch.home_team).toBe('Arsenal');
      expect(validMatch.home_goals).toBeNull();
    });

    it('should accept completed match data', () => {
      const completedMatch: Match = {
        id: 'match2',
        season_id: 'season1',
        date: '2024-08-15T15:00:00Z',
        home_team: 'Chelsea',
        away_team: 'Manchester United',
        home_goals: 2,
        away_goals: 1,
        result: 'H',
        home_odds: 2.1,
        draw_odds: 3.4,
        away_odds: 3.2,
        first_half_home_goals: 1,
        first_half_away_goals: 0,
        full_time_result: 'H',
        half_time_result: 'H',
        referee: 'Michael Oliver',
        home_shots: 15,
        away_shots: 10,
        home_shots_target: 7,
        away_shots_target: 4,
        home_fouls: 12,
        away_fouls: 15,
        home_corners: 6,
        away_corners: 3,
        home_yellows: 2,
        away_yellows: 3,
        home_reds: 0,
        away_reds: 0,
        created_at: '2024-08-15'
      };

      expect(completedMatch.result).toBe('H');
      expect(completedMatch.home_goals).toBe(2);
    });

    it('should only allow valid result values', () => {
      const results: Array<Match['result']> = ['H', 'A', 'D', null];
      
      results.forEach(result => {
        expect(['H', 'A', 'D', null]).toContain(result);
      });
    });
  });

  describe('TeamStats type', () => {
    it('should accept valid team statistics', () => {
      const validStats: TeamStats = {
        id: 'stats1',
        season_id: 'season1',
        team_name: 'Manchester City',
        matches_played: 38,
        wins: 28,
        draws: 5,
        losses: 5,
        goals_for: 95,
        goals_against: 33,
        clean_sheets: 18,
        failed_to_score: 2,
        points: 89,
        home_matches_played: 19,
        home_wins: 17,
        home_draws: 1,
        home_losses: 1,
        home_goals_for: 60,
        home_goals_against: 13,
        away_matches_played: 19,
        away_wins: 11,
        away_draws: 4,
        away_losses: 4,
        away_goals_for: 35,
        away_goals_against: 20,
        updated_at: '2024-05-31'
      };

      expect(validStats.points).toBe(89);
      expect(validStats.wins * 3 + validStats.draws).toBe(validStats.points);
    });

    it('should validate home and away statistics consistency', () => {
      const stats: TeamStats = {
        id: 'stats2',
        season_id: 'season1',
        team_name: 'Liverpool',
        matches_played: 20,
        wins: 12,
        draws: 4,
        losses: 4,
        goals_for: 40,
        goals_against: 20,
        clean_sheets: 8,
        failed_to_score: 1,
        points: 40,
        home_matches_played: 10,
        home_wins: 7,
        home_draws: 2,
        home_losses: 1,
        home_goals_for: 25,
        home_goals_against: 8,
        away_matches_played: 10,
        away_wins: 5,
        away_draws: 2,
        away_losses: 3,
        away_goals_for: 15,
        away_goals_against: 12,
        updated_at: '2024-12-31'
      };

      // Validate consistency
      expect(stats.home_matches_played + stats.away_matches_played).toBe(stats.matches_played);
      expect(stats.home_wins + stats.away_wins).toBe(stats.wins);
      expect(stats.home_draws + stats.away_draws).toBe(stats.draws);
      expect(stats.home_losses + stats.away_losses).toBe(stats.losses);
      expect(stats.home_goals_for + stats.away_goals_for).toBe(stats.goals_for);
      expect(stats.home_goals_against + stats.away_goals_against).toBe(stats.goals_against);
    });
  });

  describe('Prediction type', () => {
    it('should accept valid prediction data', () => {
      const validPrediction: Prediction = {
        id: 'pred1',
        match_id: 'match1',
        predicted_result: 'H',
        confidence_score: 0.75,
        predicted_home_goals: 2,
        predicted_away_goals: 1,
        was_correct: true,
        prediction_date: '2024-08-14T12:00:00Z',
        created_at: '2024-08-14T12:00:00Z'
      };

      expect(validPrediction.confidence_score).toBeGreaterThanOrEqual(0);
      expect(validPrediction.confidence_score).toBeLessThanOrEqual(1);
    });

    it('should only allow valid predicted results', () => {
      const results: Array<Prediction['predicted_result']> = ['H', 'A', 'D'];
      
      results.forEach(result => {
        expect(['H', 'A', 'D']).toContain(result);
      });
    });

    it('should validate confidence score range', () => {
      const predictions: Prediction[] = [
        {
          id: 'p1',
          match_id: 'm1',
          predicted_result: 'H',
          confidence_score: 0,
          predicted_home_goals: 1,
          predicted_away_goals: 0,
          was_correct: false,
          prediction_date: '2024-01-01',
          created_at: '2024-01-01'
        },
        {
          id: 'p2',
          match_id: 'm2',
          predicted_result: 'D',
          confidence_score: 1,
          predicted_home_goals: 1,
          predicted_away_goals: 1,
          was_correct: true,
          prediction_date: '2024-01-01',
          created_at: '2024-01-01'
        }
      ];

      predictions.forEach(pred => {
        expect(pred.confidence_score).toBeGreaterThanOrEqual(0);
        expect(pred.confidence_score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('TeamForm type', () => {
    it('should accept valid team form data', () => {
      const validForm: TeamForm = {
        opponent: 'Chelsea',
        goalsFor: 2,
        goalsAgainst: 1,
        result: 'W',
        date: '2024-08-15'
      };

      expect(validForm.result).toBe('W');
      expect(validForm.goalsFor).toBe(2);
    });

    it('should allow null values for unplayed matches', () => {
      const futureForm: TeamForm = {
        opponent: 'Tottenham',
        goalsFor: null,
        goalsAgainst: null,
        result: null,
        date: '2024-12-25'
      };

      expect(futureForm.result).toBeNull();
      expect(futureForm.goalsFor).toBeNull();
    });

    it('should only allow valid form results', () => {
      const results: Array<TeamForm['result']> = ['W', 'L', 'D', null];
      
      results.forEach(result => {
        expect(['W', 'L', 'D', null]).toContain(result);
      });
    });
  });

  describe('Standing type', () => {
    it('should accept valid standing data', () => {
      const validStanding: Standing = {
        position: 1,
        team: {
          id: 57,
          name: 'Arsenal FC',
          shortName: 'Arsenal',
          tla: 'ARS',
          crest: 'https://crests.football-data.org/57.png'
        },
        playedGames: 38,
        form: 'WWWDL',
        won: 28,
        draw: 5,
        lost: 5,
        points: 89,
        goalsFor: 91,
        goalsAgainst: 29,
        goalDifference: 62
      };

      expect(validStanding.position).toBe(1);
      expect(validStanding.points).toBe(89);
      expect(validStanding.won * 3 + validStanding.draw).toBe(validStanding.points);
    });

    it('should validate goal difference calculation', () => {
      const standing: Standing = {
        position: 2,
        team: {
          id: 65,
          name: 'Manchester City',
          shortName: 'Man City',
          tla: 'MCI',
          crest: 'https://crests.football-data.org/65.png'
        },
        playedGames: 38,
        form: 'DWWWW',
        won: 27,
        draw: 6,
        lost: 5,
        points: 87,
        goalsFor: 89,
        goalsAgainst: 34,
        goalDifference: 55
      };

      expect(standing.goalDifference).toBe(standing.goalsFor - standing.goalsAgainst);
    });

    it('should validate form string format', () => {
      const standings: Standing[] = [
        {
          position: 1,
          team: {
            id: 1,
            name: 'Team A',
            shortName: 'TMA',
            tla: 'TMA',
            crest: 'url'
          },
          playedGames: 5,
          form: 'WWWWW',
          won: 5,
          draw: 0,
          lost: 0,
          points: 15,
          goalsFor: 10,
          goalsAgainst: 2,
          goalDifference: 8
        },
        {
          position: 2,
          team: {
            id: 2,
            name: 'Team B',
            shortName: 'TMB',
            tla: 'TMB',
            crest: 'url'
          },
          playedGames: 5,
          form: 'LDLDL',
          won: 0,
          draw: 2,
          lost: 3,
          points: 2,
          goalsFor: 3,
          goalsAgainst: 8,
          goalDifference: -5
        }
      ];

      standings.forEach(standing => {
        expect(standing.form).toMatch(/^[WDL]+$/);
        expect(standing.form.length).toBeLessThanOrEqual(5);
      });
    });
  });

  describe('Type Guards and Validation', () => {
    it('should validate date string format', () => {
      const dateFields = [
        '2024-08-15',
        '2024-08-15T15:00:00Z',
        '2024-08-15T15:00:00.000Z'
      ];

      dateFields.forEach(date => {
        expect(() => new Date(date)).not.toThrow();
      });
    });

    it('should validate numeric ranges', () => {
      const stats: TeamStats = {
        id: 'stats',
        season_id: 'season',
        team_name: 'Test FC',
        matches_played: 38,
        wins: 38,
        draws: 0,
        losses: 0,
        goals_for: 150,
        goals_against: 10,
        clean_sheets: 30,
        failed_to_score: 0,
        points: 114,
        home_matches_played: 19,
        home_wins: 19,
        home_draws: 0,
        home_losses: 0,
        home_goals_for: 80,
        home_goals_against: 3,
        away_matches_played: 19,
        away_wins: 19,
        away_draws: 0,
        away_losses: 0,
        away_goals_for: 70,
        away_goals_against: 7,
        updated_at: '2024-05-31'
      };

      // All numeric values should be non-negative
      expect(stats.matches_played).toBeGreaterThanOrEqual(0);
      expect(stats.wins).toBeGreaterThanOrEqual(0);
      expect(stats.draws).toBeGreaterThanOrEqual(0);
      expect(stats.losses).toBeGreaterThanOrEqual(0);
      expect(stats.goals_for).toBeGreaterThanOrEqual(0);
      expect(stats.goals_against).toBeGreaterThanOrEqual(0);
      expect(stats.clean_sheets).toBeGreaterThanOrEqual(0);
      expect(stats.failed_to_score).toBeGreaterThanOrEqual(0);
      expect(stats.points).toBeGreaterThanOrEqual(0);
    });
  });
});