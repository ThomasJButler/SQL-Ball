/*
  # Remove Predictions Table for SQL-Ball Transformation
  
  This migration removes all prediction-related database objects as part of
  the transformation from PLOracle to SQL-Ball. SQL-Ball focuses on pattern
  discovery and data analytics, not predictions.
  
  1. Drop Views
    - Drop prediction_accuracy_view
  
  2. Drop Tables
    - Drop predictions table
  
  3. Keep
    - matches table (for historical data analysis)
    - seasons table (for temporal analysis)
    - match_statistics_view (for pattern discovery)
    - team_form_view (for historical analysis)
*/

-- Drop prediction-related views
DROP VIEW IF EXISTS prediction_accuracy_view CASCADE;

-- Drop predictions table
DROP TABLE IF EXISTS predictions CASCADE;

-- Update match_statistics_view comment to reflect new purpose
COMMENT ON VIEW match_statistics_view IS 'Aggregated match statistics for pattern discovery and historical analysis';

-- Update team_form_view comment
COMMENT ON VIEW team_form_view IS 'Recent team performance for trend analysis and pattern discovery';

-- Add new indexes for pattern discovery queries
CREATE INDEX IF NOT EXISTS idx_matches_goals_difference ON matches((home_goals - away_goals));
CREATE INDEX IF NOT EXISTS idx_matches_total_goals ON matches((home_goals + away_goals));
CREATE INDEX IF NOT EXISTS idx_matches_unusual_scores ON matches(home_goals, away_goals) 
  WHERE (home_goals > 5 OR away_goals > 5 OR (home_goals + away_goals) > 8);

-- Create a new view for unusual match statistics
CREATE OR REPLACE VIEW unusual_matches_view AS
SELECT 
  m.id,
  m.date,
  m.home_team,
  m.away_team,
  m.home_goals,
  m.away_goals,
  m.home_goals - m.away_goals as goal_difference,
  m.home_goals + m.away_goals as total_goals,
  CASE 
    WHEN m.home_goals > 5 OR m.away_goals > 5 THEN 'High Scoring'
    WHEN ABS(m.home_goals - m.away_goals) > 4 THEN 'Large Victory'
    WHEN m.home_goals + m.away_goals > 7 THEN 'Goal Fest'
    WHEN m.home_goals = 0 AND m.away_goals = 0 THEN 'Goalless Draw'
    WHEN m.home_shots_target > 15 AND m.home_goals = 0 THEN 'Wasteful Home'
    WHEN m.away_shots_target > 15 AND m.away_goals = 0 THEN 'Wasteful Away'
    ELSE NULL
  END as unusual_type,
  s.name as season
FROM matches m
JOIN seasons s ON m.season_id = s.id
WHERE 
  m.home_goals IS NOT NULL 
  AND m.away_goals IS NOT NULL
  AND (
    m.home_goals > 5 OR 
    m.away_goals > 5 OR 
    ABS(m.home_goals - m.away_goals) > 4 OR
    m.home_goals + m.away_goals > 7 OR
    (m.home_goals = 0 AND m.away_goals = 0) OR
    (m.home_shots_target > 15 AND m.home_goals = 0) OR
    (m.away_shots_target > 15 AND m.away_goals = 0)
  )
ORDER BY m.date DESC;

COMMENT ON VIEW unusual_matches_view IS 'Matches with unusual or notable statistics for pattern discovery';

-- Grant read access to the new view
GRANT SELECT ON unusual_matches_view TO public;