import { ChatOpenAI } from '@langchain/openai';
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
  private llm: ChatOpenAI;
  private schemaEmbeddings: SchemaEmbeddings;
  private sqlChain: LLMChain;
  private explanationChain: LLMChain;
  private footballTerms: Map<string, string[]>;

  constructor(apiKey?: string) {
    this.llm = new ChatOpenAI({
      openAIApiKey: apiKey || import.meta.env.VITE_OPENAI_API_KEY || '',
      modelName: 'gpt-4',
      temperature: 0.1, // Low temperature for consistent SQL generation
    });

    this.schemaEmbeddings = new SchemaEmbeddings(apiKey);
    this.footballTerms = this.initializeFootballTerms();
    
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

  private initializeFootballTerms(): Map<string, string[]> {
    const terms = new Map<string, string[]>();
    
    // Goal-related terms
    terms.set('goals', ['home_goals', 'away_goals']);
    terms.set('scored', ['home_goals', 'away_goals']);
    terms.set('scoring', ['home_goals', 'away_goals']);
    
    // Card-related terms
    terms.set('cards', ['home_yellows', 'away_yellows', 'home_reds', 'away_reds']);
    terms.set('yellow cards', ['home_yellows', 'away_yellows']);
    terms.set('red cards', ['home_reds', 'away_reds']);
    terms.set('bookings', ['home_yellows', 'away_yellows', 'home_reds', 'away_reds']);
    
    // Shot-related terms
    terms.set('shots', ['home_shots', 'away_shots']);
    terms.set('shots on target', ['home_shots_target', 'away_shots_target']);
    terms.set('shooting', ['home_shots', 'away_shots']);
    
    // Other match statistics
    terms.set('corners', ['home_corners', 'away_corners']);
    terms.set('fouls', ['home_fouls', 'away_fouls']);
    
    // Team-related terms
    terms.set('home', ['home_team', 'home_goals', 'home_shots']);
    terms.set('away', ['away_team', 'away_goals', 'away_shots']);
    terms.set('teams', ['home_team', 'away_team']);
    
    // Result-related terms
    terms.set('win', ['result']);
    terms.set('wins', ['result']);
    terms.set('victory', ['result']);
    terms.set('draw', ['result']);
    terms.set('loss', ['result']);
    
    // Match-related terms
    terms.set('matches', ['id', 'date', 'home_team', 'away_team']);
    terms.set('games', ['id', 'date', 'home_team', 'away_team']);
    terms.set('fixtures', ['id', 'date', 'home_team', 'away_team']);
    
    // Season-related terms
    terms.set('season', ['season_id']);
    terms.set('seasons', ['seasons']);
    
    return terms;
  }

  async generateQuery(naturalQuery: string): Promise<QueryResult> {
    try {
      console.log(`🔍 Generating query for: "${naturalQuery}"`);
      
      // 1. Enhance query with football-specific terms
      const enhancedQuery = this.enhanceQueryWithFootballTerms(naturalQuery);
      console.log(`🏈 Enhanced query: "${enhancedQuery}"`);
      
      // 2. Search for relevant schema information
      await this.schemaEmbeddings.initialize();
      const schemaResults = await this.schemaEmbeddings.searchSchema(enhancedQuery);
      const relevantTables = await this.schemaEmbeddings.getRelevantTables(enhancedQuery);
      
      console.log(`📊 Found ${schemaResults.length} schema matches, ${relevantTables.length} relevant tables`);
      
      // 3. Build schema context
      const schemaContext = schemaResults
        .map(doc => doc.pageContent)
        .join('\n');
      
      // 4. Check if we have OpenAI API key for generation
      const apiKey = this.llm.openAIApiKey;
      if (!apiKey || apiKey === '') {
        console.log('⚠️ No OpenAI API key - using template-based generation');
        return this.generateTemplateBasedQuery(naturalQuery, relevantTables);
      }
      
      // 5. Generate SQL query using LLM
      const sqlResult = await this.sqlChain.call({
        naturalQuery: enhancedQuery,
        schemaContext,
        tables: relevantTables.join(', ')
      });
      
      const sql = sqlResult.text.trim();
      
      // 6. Generate explanation
      const explanationResult = await this.explanationChain.call({
        sql,
        naturalQuery
      });
      
      const explanation = explanationResult.text.trim();
      
      // 7. Calculate confidence based on schema match
      const confidence = this.calculateConfidence(schemaResults.length, relevantTables.length);
      
      // 8. Generate optimization suggestions
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
      // Fallback to template-based generation
      return this.generateFallbackQuery(naturalQuery);
    }
  }

  private enhanceQueryWithFootballTerms(query: string): string {
    let enhanced = query;
    
    // Add football context if not present
    if (!enhanced.toLowerCase().includes('football') && 
        !enhanced.toLowerCase().includes('soccer') && 
        !enhanced.toLowerCase().includes('match') &&
        !enhanced.toLowerCase().includes('game')) {
      enhanced = `football ${enhanced}`;
    }
    
    return enhanced;
  }

  private generateTemplateBasedQuery(naturalQuery: string, tables: string[]): QueryResult {
    // Template-based query generation for common patterns
    const query = naturalQuery.toLowerCase();
    let sql = '';
    let explanation = '';
    
    if (query.includes('goal') && query.includes('most')) {
      sql = `SELECT home_team, away_team, (home_goals + away_goals) as total_goals, date
             FROM matches 
             ORDER BY total_goals DESC 
             LIMIT 10`;
      explanation = 'This query finds the matches with the most goals by adding home and away goals, then sorting by the total.';
    } else if (query.includes('card') && query.includes('most')) {
      sql = `SELECT home_team, away_team, (home_yellows + away_yellows + home_reds + away_reds) as total_cards, date
             FROM matches 
             ORDER BY total_cards DESC 
             LIMIT 10`;
      explanation = 'This query finds matches with the most cards by adding all yellow and red cards.';
    } else if (query.includes('recent') || query.includes('latest')) {
      sql = `SELECT home_team, away_team, home_goals, away_goals, date, result
             FROM matches 
             ORDER BY date DESC 
             LIMIT 20`;
      explanation = 'This query shows the most recent matches, ordered by date.';
    } else if (query.includes('home win')) {
      sql = `SELECT home_team, away_team, home_goals, away_goals, date
             FROM matches 
             WHERE result = 'H' 
             ORDER BY (home_goals - away_goals) DESC 
             LIMIT 15`;
      explanation = 'This query finds home wins, ordered by the goal difference.';
    } else {
      // Default query
      sql = `SELECT home_team, away_team, home_goals, away_goals, date, result
             FROM matches 
             ORDER BY date DESC 
             LIMIT 10`;
      explanation = 'This is a general query showing recent matches with basic information.';
    }
    
    return {
      sql,
      explanation,
      confidence: 0.7,
      tables: ['matches'],
      optimizationSuggestions: this.generateOptimizationSuggestions(sql),
      performanceEstimate: this.estimatePerformance(sql)
    };
  }

  private generateFallbackQuery(naturalQuery: string): QueryResult {
    return {
      sql: 'SELECT * FROM matches ORDER BY date DESC LIMIT 10',
      explanation: 'Default query showing recent matches (error occurred in query generation)',
      confidence: 0.3,
      tables: ['matches'],
      optimizationSuggestions: ['Consider being more specific in your query'],
      performanceEstimate: 'Fast (<50ms)'
    };
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