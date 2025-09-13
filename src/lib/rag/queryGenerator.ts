import { OpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { SchemaEmbeddings } from './schemaEmbeddings';

export interface QueryResult {
  sql: string;
  explanation: string;
  confidence: number;
  tables: string[];
  optimizationSuggestions?: string[];
  performanceEstimate?: string;
}

export class QueryGenerator {
  private llm: OpenAI;
  private schemaEmbeddings: SchemaEmbeddings;
  private sqlChain: LLMChain;
  private explanationChain: LLMChain;

  constructor(apiKey?: string) {
    this.llm = new OpenAI({
      openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
      modelName: 'gpt-4',
      temperature: 0.1, // Low temperature for consistent SQL generation
    });

    this.schemaEmbeddings = new SchemaEmbeddings(apiKey);
    
    // SQL generation prompt
    const sqlPrompt = new PromptTemplate({
      inputVariables: ['naturalQuery', 'schemaContext', 'tables'],
      template: `You are an expert SQL query generator for Premier League football match data.

Database Schema Context:
{schemaContext}

Relevant Tables:
{tables}

Natural Language Query: {naturalQuery}

Generate a PostgreSQL query that answers the user's question. Follow these rules:
1. Use only the tables and columns provided in the schema
2. Include appropriate JOINs when needed
3. Add ORDER BY and LIMIT clauses when appropriate
4. Use meaningful column aliases
5. For unusual statistics, consider using CASE statements
6. Include comments in the SQL to explain complex logic

Return ONLY the SQL query, no explanation.`
    });

    // Explanation generation prompt
    const explanationPrompt = new PromptTemplate({
      inputVariables: ['sql', 'naturalQuery'],
      template: `Explain this SQL query in simple, beginner-friendly terms:

User's Question: {naturalQuery}

SQL Query:
{sql}

Provide a brief explanation (2-3 sentences) that:
1. Explains what the query does in plain English
2. Mentions key concepts (like JOINs, aggregations) in simple terms
3. Explains why this query answers the user's question`
    });

    this.sqlChain = new LLMChain({ llm: this.llm, prompt: sqlPrompt });
    this.explanationChain = new LLMChain({ llm: this.llm, prompt: explanationPrompt });
  }

  async generateQuery(naturalQuery: string): Promise<QueryResult> {
    try {
      // 1. Search for relevant schema information
      const schemaResults = await this.schemaEmbeddings.searchSchema(naturalQuery);
      const relevantTables = await this.schemaEmbeddings.getRelevantTables(naturalQuery);
      
      // 2. Build schema context
      const schemaContext = schemaResults
        .map(doc => doc.pageContent)
        .join('\n');
      
      // 3. Generate SQL query
      const sqlResult = await this.sqlChain.call({
        naturalQuery,
        schemaContext,
        tables: relevantTables.join(', ')
      });
      
      const sql = sqlResult.text.trim();
      
      // 4. Generate explanation
      const explanationResult = await this.explanationChain.call({
        sql,
        naturalQuery
      });
      
      const explanation = explanationResult.text.trim();
      
      // 5. Calculate confidence based on schema match
      const confidence = this.calculateConfidence(schemaResults.length, relevantTables.length);
      
      // 6. Generate optimization suggestions
      const optimizationSuggestions = this.generateOptimizationSuggestions(sql);
      
      return {
        sql,
        explanation,
        confidence,
        tables: relevantTables,
        optimizationSuggestions,
        performanceEstimate: this.estimatePerformance(sql)
      };
    } catch (error) {
      console.error('Error generating query:', error);
      throw new Error('Failed to generate SQL query');
    }
  }

  private calculateConfidence(schemaMatches: number, tableCount: number): number {
    // Simple confidence calculation based on schema matches
    const baseConfidence = 0.5;
    const schemaBoost = Math.min(schemaMatches * 0.1, 0.3);
    const tableBoost = Math.min(tableCount * 0.1, 0.2);
    
    return Math.min(baseConfidence + schemaBoost + tableBoost, 0.95);
  }

  private generateOptimizationSuggestions(sql: string): string[] {
    const suggestions: string[] = [];
    
    // Check for missing indexes
    if (sql.includes('WHERE') && !sql.includes('id')) {
      suggestions.push('Consider adding an index on the WHERE clause columns');
    }
    
    // Check for SELECT *
    if (sql.includes('SELECT *')) {
      suggestions.push('Specify exact columns instead of SELECT * for better performance');
    }
    
    // Check for large LIMIT
    if (!sql.includes('LIMIT') && sql.includes('ORDER BY')) {
      suggestions.push('Add a LIMIT clause to restrict result set size');
    }
    
    // Check for subqueries
    if (sql.includes('SELECT') && sql.lastIndexOf('SELECT') !== sql.indexOf('SELECT')) {
      suggestions.push('Consider using JOINs instead of subqueries for better performance');
    }
    
    return suggestions;
  }

  private estimatePerformance(sql: string): string {
    // Simple performance estimation
    const hasJoins = sql.includes('JOIN');
    const hasAggregations = sql.includes('GROUP BY') || sql.includes('COUNT') || sql.includes('SUM');
    const hasLimit = sql.includes('LIMIT');
    
    if (!hasJoins && hasLimit) {
      return 'Very Fast (<10ms)';
    } else if (hasJoins && !hasAggregations) {
      return 'Fast (<50ms)';
    } else if (hasAggregations) {
      return 'Moderate (50-200ms)';
    } else {
      return 'Variable (depends on data size)';
    }
  }

  // Pattern discovery specific queries
  async generatePatternQuery(patternType: 'upsets' | 'high-scoring' | 'anomalies' | 'trends'): Promise<QueryResult> {
    const patternQueries = {
      upsets: "Show me the biggest upset victories where the away team won by 3 or more goals",
      'high-scoring': "Find matches with 7 or more total goals",
      anomalies: "Show unusual matches with strange statistics like high shots but no goals",
      trends: "Show team performance trends over the last 10 matches"
    };
    
    return this.generateQuery(patternQueries[patternType]);
  }
}