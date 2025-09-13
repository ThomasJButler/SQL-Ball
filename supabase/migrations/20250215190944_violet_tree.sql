/*
  # Add prediction views and indexes

  1. New Views
    - `match_statistics_view`: Aggregates match statistics for teams
    - `team_form_view`: Shows recent form for teams
    - `prediction_accuracy_view`: Shows prediction accuracy stats

  2. Indexes
    - Add indexes for team names and dates for better query performance
*/

-- Create view for match statistics
CREATE OR REPLACE VIEW match_statistics_view AS
WITH team_stats AS (
  -- Home team statistics
  SELECT
    home_team as team,
    AVG(home_goals) as avg_goals_scored,
    AVG(away_goals) as avg_goals_conceded,
    COUNT(*) as total_matches,
    SUM(CASE WHEN result = 'H' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END) as draws,
    SUM(CASE WHEN result = 'A' THEN 1 ELSE 0 END) as losses
  FROM matches
  GROUP BY home_team
  
  UNION ALL
  
  -- Away team statistics
  SELECT
    away_team as team,
    AVG(away_goals) as avg_goals_scored,
    AVG(home_goals) as avg_goals_conceded,
    COUNT(*) as total_matches,
    SUM(CASE WHEN result = 'A' THEN 1 ELSE 0 END) as wins,
    SUM(CASE WHEN result = 'D' THEN 1 ELSE 0 END) as draws,
    SUM(CASE WHEN result = 'H' THEN 1 ELSE 0 END) as losses
  FROM matches
  GROUP BY away_team
)
SELECT
  team,
  ROUND(AVG(avg_goals_scored)::numeric, 2) as avg_goals_scored,
  ROUND(AVG(avg_goals_conceded)::numeric, 2) as avg_goals_conceded,
  SUM(total_matches) as total_matches,
  SUM(wins) as total_wins,
  SUM(draws) as total_draws,
  SUM(losses) as total_losses,
  ROUND((SUM(wins)::float / SUM(total_matches) * 100)::numeric, 2) as win_percentage
FROM team_stats
GROUP BY team;

-- Create view for team form (last 5 matches)
CREATE OR REPLACE VIEW team_form_view AS
WITH recent_matches AS (
  SELECT
    m.date,
    m.home_team as team,
    CASE 
      WHEN m.result = 'H' THEN 'W'
      WHEN m.result = 'D' THEN 'D'
      ELSE 'L'
    END as result,
    m.home_goals as goals_scored,
    m.away_goals as goals_conceded,
    ROW_NUMBER() OVER (PARTITION BY m.home_team ORDER BY m.date DESC) as rn
  FROM matches m
  
  UNION ALL
  
  SELECT
    m.date,
    m.away_team as team,
    CASE 
      WHEN m.result = 'A' THEN 'W'
      WHEN m.result = 'D' THEN 'D'
      ELSE 'L'
    END as result,
    m.away_goals as goals_scored,
    m.home_goals as goals_conceded,
    ROW_NUMBER() OVER (PARTITION BY m.away_team ORDER BY m.date DESC) as rn
  FROM matches m
)
SELECT
  team,
  STRING_AGG(result, '-' ORDER BY date DESC) as form,
  ROUND(AVG(goals_scored)::numeric, 2) as avg_recent_goals_scored,
  ROUND(AVG(goals_conceded)::numeric, 2) as avg_recent_goals_conceded
FROM recent_matches
WHERE rn <= 5
GROUP BY team;

-- Create view for prediction accuracy
CREATE OR REPLACE VIEW prediction_accuracy_view AS
SELECT
  s.name as season,
  COUNT(*) as total_predictions,
  SUM(CASE WHEN p.was_correct THEN 1 ELSE 0 END) as correct_predictions,
  ROUND((SUM(CASE WHEN p.was_correct THEN 1 ELSE 0 END)::float / COUNT(*) * 100)::numeric, 2) as accuracy_percentage,
  ROUND(AVG(p.confidence_score)::numeric, 2) as avg_confidence_score
FROM predictions p
JOIN matches m ON p.match_id = m.id
JOIN seasons s ON m.season_id = s.id
GROUP BY s.name
ORDER BY s.name DESC;

-- Add additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON matches(home_team);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON matches(away_team);
CREATE INDEX IF NOT EXISTS idx_matches_date_desc ON matches(date DESC);

-- Add function to get team form
CREATE OR REPLACE FUNCTION get_team_form(team_name text, num_matches integer DEFAULT 5)
RETURNS TABLE (
  match_date timestamptz,
  opponent text,
  result char(1),
  goals_scored integer,
  goals_conceded integer
) AS $$
BEGIN
  RETURN QUERY
  WITH team_matches AS (
    SELECT
      date as match_date,
      away_team as opponent,
      result,
      home_goals as goals_scored,
      away_goals as goals_conceded,
      ROW_NUMBER() OVER (ORDER BY date DESC) as rn
    FROM matches
    WHERE home_team = team_name
    
    UNION ALL
    
    SELECT
      date as match_date,
      home_team as opponent,
      CASE 
        WHEN result = 'H' THEN 'A'
        WHEN result = 'A' THEN 'H'
        ELSE 'D'
      END as result,
      away_goals as goals_scored,
      home_goals as goals_conceded,
      ROW_NUMBER() OVER (ORDER BY date DESC) as rn
    FROM matches
    WHERE away_team = team_name
  )
  SELECT
    match_date,
    opponent,
    result,
    goals_scored,
    goals_conceded
  FROM team_matches
  WHERE rn <= num_matches
  ORDER BY match_date DESC;
END;
$$ LANGUAGE plpgsql;