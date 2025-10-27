/**
 * @author Tom Butler
 * @date 2025-10-25
 * @description API service layer for backend communication. Handles RAG-related API calls
 *              to FastAPI backend including query conversion, SQL optimisation, and pattern discovery.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface QueryRequest {
  question: string;
  season?: string;
  include_explanation?: boolean;
  api_key?: string;
}

export interface QueryResponse {
  sql: string;
  explanation?: string;
  results?: any[];
  execution_time_ms?: number;
  optimizations?: string[];
}

export interface OptimizeRequest {
  sql: string;
  context?: string;
}

export interface OptimizeResponse {
  original_sql: string;
  optimized_sql: string;
  improvements: string[];
  estimated_performance_gain?: string;
}

export interface PatternDiscoveryRequest {
  pattern_type: 'upsets' | 'high-scoring' | 'anomalies' | 'trends';
  season?: string;
  limit?: number;
}

export interface SchemaResponse {
  tables: string[];
  schema: Record<string, any>;
}

export interface DashboardStats {
  total_matches: number;
  total_goals: number;
  home_win_percentage: number;
  away_win_percentage: number;
  draw_percentage: number;
  avg_goals_per_match: number;
  total_teams: number;
  total_leagues: number;
  high_scoring_matches: number;
  clean_sheets: number;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label?: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
  }>;
  type: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recent_matches: any[];
  charts: Record<string, ChartData>;
  last_updated: string;
}

class APIService {
  private headers = {
    'Content-Type': 'application/json',
  };

  /**
   * Checks backend API health and RAG initialisation status
   * @return {Promise<boolean>} True if backend is healthy and RAG is initialised
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.status === 'healthy' && data.rag_initialized;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  /**
   * Converts natural language question to SQL query using backend RAG system
   * @param {QueryRequest} request - Query request with question, season, and optional API key
   * @return {Promise<QueryResponse>} Generated SQL query with explanation and results
   */
  async convertToSQL(request: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to convert query to SQL:', error);
      throw error;
    }
  }

  /**
   * Optimises SQL query for better performance
   * @param {OptimizeRequest} request - SQL query to optimise with optional context
   * @return {Promise<OptimizeResponse>} Optimised SQL with performance improvements
   */
  async optimizeSQL(request: OptimizeRequest): Promise<OptimizeResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/optimize`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to optimize SQL:', error);
      throw error;
    }
  }

  /**
   * Discovers patterns in football data (upsets, high-scoring games, anomalies, trends)
   * @param {PatternDiscoveryRequest} request - Pattern type and filtering criteria
   * @return {Promise<QueryResponse>} SQL query and results for discovered patterns
   */
  async discoverPatterns(request: PatternDiscoveryRequest): Promise<QueryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patterns`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to discover patterns:', error);
      throw error;
    }
  }

  /**
   * Retrieves database schema information including tables and structure
   * @return {Promise<SchemaResponse>} Database schema with tables and column definitions
   */
  async getSchema(): Promise<SchemaResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schema`);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get schema:', error);
      throw error;
    }
  }

  /**
   * Validates SQL for common issues before execution
   * Checks for conflicting season conditions that would return zero results
   * @param {string} sql - SQL query to validate
   * @return {string[]} Array of validation error messages
   */
  private validateSQL(sql: string): string[] {
    const errors: string[] = [];

    // Check for conflicting season conditions
    const seasonMatches = sql.match(/season\s*=\s*['"]\s*([^'"]+)\s*['"]/gi);
    if (seasonMatches && seasonMatches.length > 1) {
      const uniqueSeasons = new Set(
        seasonMatches.map(match => match.match(/['"]\s*([^'"]+)\s*['"]/)![1])
      );
      if (uniqueSeasons.size > 1) {
        errors.push('Query contains conflicting season conditions. A row cannot match multiple seasons.');
      }
    }

    return errors;
  }

  /**
   * Executes SQL query via backend (requires database access configuration)
   * Validates query before execution and handles backend errors gracefully
   * @param {string} sql - SQL query to execute
   * @return {Promise<any[]>} Query results as array of row objects
   */
  async executeSQL(sql: string): Promise<any[]> {
    try {
      // Validate SQL before execution
      const validationErrors = this.validateSQL(sql);
      if (validationErrors.length > 0) {
        console.warn('SQL validation warnings:', validationErrors);
        // Don't throw error, let backend handle it - just log warning
      }

      const response = await fetch(`${API_BASE_URL}/api/execute`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ sql }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.detail || response.statusText;
        throw new Error(`API request failed: ${errorMessage}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Failed to execute SQL:', error);
      throw error;
    }
  }

  /**
   * Checks if backend API is available with 5 second timeout
   * Verifies both connectivity and RAG system initialisation
   * @return {Promise<boolean>} True if backend is reachable and fully initialised
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Implement timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        // Verify it's actually our backend and RAG is initialized
        const isValid = data.status === 'healthy' && data.rag_initialized === true;
        console.log('Backend health check:', { 
          status: response.status, 
          data, 
          isValid 
        });
        return isValid;
      }
      
      console.warn('Backend health check failed:', {
        status: response.status,
        statusText: response.statusText,
        url: `${API_BASE_URL}/health`
      });
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Backend connection error:', {
        error: errorMessage,
        url: `${API_BASE_URL}/health`,
        API_BASE_URL
      });
      return false;
    }
  }

  /**
   * Fetches complete dashboard data from backend
   * @param {string} league - Optional league filter
   * @return {Promise<DashboardResponse>} Complete dashboard data with stats, matches, and charts
   */
  async getDashboardData(league?: string): Promise<DashboardResponse> {
    try {
      const params = league ? `?league=${encodeURIComponent(league)}` : '';
      const response = await fetch(`${API_BASE_URL}/api/dashboard${params}`);

      if (!response.ok) {
        throw new Error(`Dashboard API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }

  /**
   * Fetches match data for dashboard
   * @param {number} limit - Number of matches to fetch
   * @param {string} league - Optional league filter
   * @return {Promise<any[]>} Array of matches
   */
  async getDashboardMatches(limit: number = 1000, league?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (league) params.append('league', league);

      const response = await fetch(`${API_BASE_URL}/api/dashboard/matches?${params}`);

      if (!response.ok) {
        throw new Error(`Matches API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      throw error;
    }
  }

  /**
   * Fetches dashboard statistics
   * @param {string} league - Optional league filter
   * @return {Promise<DashboardStats>} Dashboard statistics
   */
  async getDashboardStats(league?: string): Promise<DashboardStats> {
    try {
      const params = league ? `?league=${encodeURIComponent(league)}` : '';
      const response = await fetch(`${API_BASE_URL}/api/dashboard/stats${params}`);

      if (!response.ok) {
        throw new Error(`Stats API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      throw error;
    }
  }

  /**
   * Fetches chart data for specific visualization
   * @param {string} chartType - Type of chart (goals_trend, results_distribution, league_table)
   * @param {string} league - Optional league filter
   * @return {Promise<ChartData>} Chart-ready data
   */
  async getChartData(chartType: string, league?: string): Promise<ChartData> {
    try {
      const params = league ? `?league=${encodeURIComponent(league)}` : '';
      const response = await fetch(`${API_BASE_URL}/api/dashboard/charts/${chartType}${params}`);

      if (!response.ok) {
        throw new Error(`Chart API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      throw error;
    }
  }

  /**
   * Analyzes dashboard data using RAG system
   * @param {string} query - Analysis query
   * @param {string} league - Optional league filter
   * @return {Promise<any>} Analysis results
   */
  async analyzeDashboard(query: string, league?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      if (league) params.append('league', league);

      const response = await fetch(`${API_BASE_URL}/api/dashboard/analyze?${params}`, {
        method: 'POST',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Analysis API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to analyze dashboard:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const apiService = new APIService();

// Export for use in stores or components
export default apiService;
