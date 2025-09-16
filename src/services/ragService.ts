/**
 * RAG Service for SQL-Ball
 * Connects to FastAPI backend for NL to SQL conversion
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface QueryRequest {
  question: string;
  season?: string;
  include_explanation?: boolean;
  limit?: number;
  api_key?: string;  // OpenAI API key from localStorage
}

export interface QueryResponse {
  sql: string;
  explanation?: string;
  results?: any[];
  execution_time_ms?: number;
  optimizations?: string[];
  mappings_used?: Record<string, string>;
}

export interface OptimizeRequest {
  sql: string;
  context?: string;
}

export interface OptimizeResponse {
  original_sql: string;
  optimized_sql: string;
  explanation: string;
  suggestions: string[];
}

export interface Pattern {
  type: string;
  description: string;
  confidence: number;
}

export interface SchemaInfo {
  tables: Array<{
    name: string;
    columns: string[];
    description: string;
  }>;
  relationships: Array<{
    from: string;
    to: string;
    type: string;
  }>;
  seasons: string[];
}

class RAGService {
  /**
   * Convert natural language to SQL
   */
  async processQuery(request: QueryRequest): Promise<QueryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Query processing error:', error);
      throw error;
    }
  }

  /**
   * Optimize an SQL query
   */
  async optimizeQuery(request: OptimizeRequest): Promise<OptimizeResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Optimization error:', error);
      throw error;
    }
  }

  /**
   * Discover patterns in data
   */
  async discoverPatterns(table: string, patternType: string = 'anomaly'): Promise<{
    patterns: Pattern[];
    sql_queries: string[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patterns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table, pattern_type: patternType }),
      });

      if (!response.ok) {
        throw new Error(`Pattern discovery failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Pattern discovery error:', error);
      throw error;
    }
  }

  /**
   * Get database schema information
   */
  async getSchema(): Promise<SchemaInfo> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schema`);

      if (!response.ok) {
        throw new Error(`Schema fetch failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Schema fetch error:', error);
      throw error;
    }
  }

  /**
   * Get example queries
   */
  async getExamples(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/examples`);

      if (!response.ok) {
        throw new Error(`Examples fetch failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Examples fetch error:', error);
      throw error;
    }
  }

  /**
   * Validate SQL syntax
   */
  async validateSQL(sql: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Validation error:', error);
      throw error;
    }
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.status === 'healthy' && data.rag_initialized;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const ragService = new RAGService();