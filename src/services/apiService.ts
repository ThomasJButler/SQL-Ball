/**
 * API Service Layer for Backend Communication
 * Handles all RAG-related API calls to the FastAPI backend
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

class APIService {
  private headers = {
    'Content-Type': 'application/json',
  };

  /**
   * Health check for the API
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
   * Convert natural language to SQL
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
   * Optimize SQL query
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
   * Discover patterns in the data
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
   * Get database schema information
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
   * Validate SQL for common issues before execution
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
   * Execute SQL query (if backend is configured with database access)
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
   * Check if backend API is available
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
}

// Export singleton instance
export const apiService = new APIService();

// Export for use in stores or components
export default apiService;
