/*
  # Football Database Schema

  1. New Tables
    - `seasons`
      - `id` (uuid, primary key)
      - `name` (text, unique) - e.g., "2023-2024"
      - `start_date` (date)
      - `end_date` (date)
      - `is_current` (boolean)
      - `created_at` (timestamp)

    - `matches`
      - `id` (uuid, primary key)
      - `season_id` (uuid, foreign key)
      - `date` (timestamp)
      - `home_team` (text)
      - `away_team` (text)
      - `home_goals` (integer)
      - `away_goals` (integer)
      - `result` (char) - 'H', 'A', or 'D'
      - Various match statistics
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read data
*/

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES seasons(id) NOT NULL,
  date timestamptz NOT NULL,
  home_team text NOT NULL,
  away_team text NOT NULL,
  home_goals integer,
  away_goals integer,
  result char(1) CHECK (result IN ('H', 'A', 'D')),
  home_odds decimal,
  draw_odds decimal,
  away_odds decimal,
  first_half_home_goals integer,
  first_half_away_goals integer,
  full_time_result char(1) CHECK (full_time_result IN ('H', 'A', 'D')),
  half_time_result char(1) CHECK (half_time_result IN ('H', 'A', 'D')),
  referee text,
  home_shots integer,
  away_shots integer,
  home_shots_target integer,
  away_shots_target integer,
  home_fouls integer,
  away_fouls integer,
  home_corners integer,
  away_corners integer,
  home_yellows integer,
  away_yellows integer,
  home_reds integer,
  away_reds integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_season_date ON matches(season_id, date);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team, away_team);

-- Enable RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to seasons"
  ON seasons
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to matches"
  ON matches
  FOR SELECT
  TO public
  USING (true);

-- Insert seasons
DO $$
BEGIN
  -- Insert seasons if they don't exist
  INSERT INTO seasons (name, start_date, end_date, is_current)
  VALUES
    ('2019-2020', '2019-08-01', '2020-05-31', false),
    ('2020-2021', '2020-08-01', '2021-05-31', false),
    ('2021-2022', '2021-08-01', '2022-05-31', false),
    ('2022-2023', '2022-08-01', '2023-05-31', false),
    ('2023-2024', '2023-08-01', '2024-05-31', false),
    ('2024-2025', '2024-08-01', '2025-05-31', true)
  ON CONFLICT (name) DO NOTHING;
END $$;