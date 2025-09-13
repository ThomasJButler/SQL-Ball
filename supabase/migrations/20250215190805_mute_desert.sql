/*
  # Add predictions table

  1. New Tables
    - `predictions`
      - `id` (uuid, primary key)
      - `match_id` (uuid, foreign key to matches)
      - `predicted_result` (char(1), H/A/D)
      - `confidence_score` (decimal)
      - `predicted_home_goals` (integer)
      - `predicted_away_goals` (integer)
      - `was_correct` (boolean)
      - `prediction_date` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `predictions` table
    - Add policy for public read access
*/

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id) NOT NULL,
  predicted_result char(1) CHECK (predicted_result IN ('H', 'A', 'D')),
  confidence_score decimal NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  predicted_home_goals integer NOT NULL,
  predicted_away_goals integer NOT NULL,
  was_correct boolean DEFAULT false,
  prediction_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);

-- Enable RLS
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to predictions"
  ON predictions
  FOR SELECT
  TO public
  USING (true);