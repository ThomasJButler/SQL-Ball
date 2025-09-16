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
  match_date: string;
  div: string; // League code (e.g., 'E0', 'SP1', 'I1')
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  result: 'H' | 'A' | 'D' | null;
  ht_home_score: number | null;
  ht_away_score: number | null;
  ht_result: 'H' | 'A' | 'D' | null;
  referee: string | null;
  home_shots: number | null;
  away_shots: number | null;
  home_shots_target: number | null;
  away_shots_target: number | null;
  home_fouls: number | null;
  away_fouls: number | null;
  home_corners: number | null;
  away_corners: number | null;
  home_yellow_cards: number | null;
  away_yellow_cards: number | null;
  home_red_cards: number | null;
  away_red_cards: number | null;
  season: string; // e.g., '2024-2025'
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


export interface TeamForm {
  match: Match;
  result: 'W' | 'L' | 'D';
  goalsScored: number;
  goalsConceded: number;
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