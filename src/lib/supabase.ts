import { createClient } from '@supabase/supabase-js';

// Database types
export interface Match {
  id: string;
  season_id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_goals: number | null;
  away_goals: number | null;
  result: 'H' | 'A' | 'D' | null;
  home_odds?: number;
  draw_odds?: number;
  away_odds?: number;
  first_half_home_goals?: number;
  first_half_away_goals?: number;
  full_time_result?: 'H' | 'A' | 'D' | null;
  half_time_result?: 'H' | 'A' | 'D' | null;
  referee?: string;
  home_shots?: number;
  away_shots?: number;
  home_shots_target?: number;
  away_shots_target?: number;
  home_fouls?: number;
  away_fouls?: number;
  home_corners?: number;
  away_corners?: number;
  home_yellows?: number;
  away_yellows?: number;
  home_reds?: number;
  away_reds?: number;
  created_at?: string;
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at?: string;
}

export interface TeamStats {
  team: string;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  total_matches: number;
  total_wins: number;
  total_draws: number;
  total_losses: number;
  win_percentage: number;
}

export interface UnusualMatch extends Match {
  goal_difference: number;
  total_goals: number;
  unusual_type: string;
  season: string;
}

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for database queries
export async function getRecentMatches(limit: number = 10): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Match[];
}

export async function getSeasons(): Promise<Season[]> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data as Season[];
}

export async function getCurrentSeason(): Promise<Season> {
  const { data, error } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_current', true)
    .single();

  if (error) throw error;
  return data as Season;
}

export async function getTeamStats(): Promise<TeamStats[]> {
  const { data, error } = await supabase
    .from('match_statistics_view')
    .select('*');

  if (error) throw error;
  return data as TeamStats[];
}

export async function getUnusualMatches(limit: number = 20): Promise<UnusualMatch[]> {
  const { data, error } = await supabase
    .from('unusual_matches_view')
    .select('*')
    .limit(limit);

  if (error) throw error;
  return data as UnusualMatch[];
}

export async function executeSQL(query: string): Promise<any> {
  // For security, this should be a server-side function
  // or use Supabase RPC with proper validation
  const { data, error } = await supabase.rpc('execute_sql', { 
    query_text: query 
  });

  if (error) throw error;
  return data;
}