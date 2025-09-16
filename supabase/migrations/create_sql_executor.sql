-- Create RPC function for executing read-only SQL queries
-- This allows the app to execute dynamically generated SQL from the RAG system

-- Drop function if exists
DROP FUNCTION IF EXISTS execute_sql(text);

-- Create the function with proper security
CREATE OR REPLACE FUNCTION execute_sql(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  sql_state text;
  error_message text;
BEGIN
  -- Security checks
  -- Only allow SELECT queries
  IF NOT (query_text ~* '^\s*SELECT') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Block dangerous keywords
  IF query_text ~* '(DROP|DELETE|INSERT|UPDATE|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXECUTE)' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  -- Add timeout for long-running queries (5 seconds)
  SET LOCAL statement_timeout = '5s';

  -- Execute the query and return results as JSON
  BEGIN
    EXECUTE format('SELECT json_agg(row) FROM (%s) row', query_text) INTO result;

    -- If no results, return empty array
    IF result IS NULL THEN
      result = '[]'::json;
    END IF;

    RETURN result;

  EXCEPTION
    WHEN OTHERS THEN
      -- Capture error details
      GET STACKED DIAGNOSTICS
        sql_state = RETURNED_SQLSTATE,
        error_message = MESSAGE_TEXT;

      -- Return error as JSON
      RETURN json_build_object(
        'error', true,
        'message', error_message,
        'sql_state', sql_state
      );
  END;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated, anon;

-- Add comment for documentation
COMMENT ON FUNCTION execute_sql(text) IS
'Executes a read-only SQL query and returns results as JSON. Only SELECT queries are allowed for security.';

-- Create a simpler function for testing queries
CREATE OR REPLACE FUNCTION test_sql(query_text text)
RETURNS TABLE(result text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow SELECT
  IF NOT (query_text ~* '^\s*SELECT') THEN
    RETURN QUERY SELECT 'Error: Only SELECT queries allowed'::text;
    RETURN;
  END IF;

  -- Execute and return as text
  RETURN QUERY EXECUTE query_text;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT ('Error: ' || SQLERRM)::text;
END;
$$;

GRANT EXECUTE ON FUNCTION test_sql(text) TO authenticated, anon;

-- Test the function with a simple query
SELECT execute_sql('SELECT COUNT(*) as total_teams FROM teams WHERE season = ''2024-2025''');