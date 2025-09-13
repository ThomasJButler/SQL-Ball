// Shared types for the application - no Supabase dependency

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  season_id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_goals: number | null;
  away_goals: number | null;
  result: 'H' | 'A' | 'D' | null;
  home_odds: number | null;
  draw_odds: number | null;
  away_odds: number | null;
  first_half_home_goals: number | null;
  first_half_away_goals: number | null;
  full_time_result: 'H' | 'A' | 'D' | null;
  half_time_result: 'H' | 'A' | 'D' | null;
  referee: string | null;
  home_shots: number | null;
  away_shots: number | null;
  home_shots_target: number | null;
  away_shots_target: number | null;
  home_fouls: number | null;
  away_fouls: number | null;
  home_corners: number | null;
  away_corners: number | null;
  home_yellows: number | null;
  away_yellows: number | null;
  home_reds: number | null;
  away_reds: number | null;
  created_at: string;
}

export interface TeamStats {
  id: string;
  season_id: string;
  team_name: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  clean_sheets: number;
  failed_to_score: number;
  points: number;
  home_matches_played: number;
  home_wins: number;
  home_draws: number;
  home_losses: number;
  home_goals_for: number;
  home_goals_against: number;
  away_matches_played: number;
  away_wins: number;
  away_draws: number;
  away_losses: number;
  away_goals_for: number;
  away_goals_against: number;
  updated_at: string;
}

export interface Prediction {
  id: string;
  match_id: string;
  predicted_result: 'H' | 'A' | 'D';
  confidence_score: number;
  predicted_home_goals: number;
  predicted_away_goals: number;
  was_correct: boolean;
  prediction_date: string;
  created_at: string;
}

export interface TeamForm {
  opponent: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: 'W' | 'L' | 'D' | null;
  date: string;
}

export interface Standing {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  playedGames: number;
  form: string;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}