import { OpenAIEmbeddings } from '@langchain/openai';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from '@langchain/core/documents';

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  description: string;
  exampleQueries?: string[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  description: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  references?: string;
}

// Our Supabase match database schema
export const MATCH_DATABASE_SCHEMA: TableSchema[] = [
  {
    name: 'matches',
    description: 'Contains all Premier League match data including goals, statistics, and referee information',
    columns: [
      { name: 'id', type: 'uuid', description: 'Unique match identifier', nullable: false, isPrimaryKey: true },
      { name: 'season_id', type: 'uuid', description: 'Season identifier', nullable: false, isForeignKey: true, references: 'seasons.id' },
      { name: 'date', type: 'timestamptz', description: 'Match date and time', nullable: false },
      { name: 'home_team', type: 'text', description: 'Home team name', nullable: false },
      { name: 'away_team', type: 'text', description: 'Away team name', nullable: false },
      { name: 'home_goals', type: 'integer', description: 'Goals scored by home team', nullable: true },
      { name: 'away_goals', type: 'integer', description: 'Goals scored by away team', nullable: true },
      { name: 'result', type: 'char(1)', description: 'Match result: H (Home win), A (Away win), D (Draw)', nullable: true },
      { name: 'home_shots', type: 'integer', description: 'Total shots by home team', nullable: true },
      { name: 'away_shots', type: 'integer', description: 'Total shots by away team', nullable: true },
      { name: 'home_shots_target', type: 'integer', description: 'Shots on target by home team', nullable: true },
      { name: 'away_shots_target', type: 'integer', description: 'Shots on target by away team', nullable: true },
      { name: 'home_corners', type: 'integer', description: 'Corner kicks for home team', nullable: true },
      { name: 'away_corners', type: 'integer', description: 'Corner kicks for away team', nullable: true },
      { name: 'home_fouls', type: 'integer', description: 'Fouls committed by home team', nullable: true },
      { name: 'away_fouls', type: 'integer', description: 'Fouls committed by away team', nullable: true },
      { name: 'home_yellows', type: 'integer', description: 'Yellow cards for home team', nullable: true },
      { name: 'away_yellows', type: 'integer', description: 'Yellow cards for away team', nullable: true },
      { name: 'home_reds', type: 'integer', description: 'Red cards for home team', nullable: true },
      { name: 'away_reds', type: 'integer', description: 'Red cards for away team', nullable: true },
      { name: 'referee', type: 'text', description: 'Match referee name', nullable: true },
    ],
    exampleQueries: [
      'Show me the biggest home wins',
      'Which teams score the most goals?',
      'Find matches with the most cards',
      'What are the highest scoring matches?',
      'Show matches where the away team won by 3+ goals'
    ]
  },
  {
    name: 'seasons',
    description: 'Premier League seasons information',
    columns: [
      { name: 'id', type: 'uuid', description: 'Unique season identifier', nullable: false, isPrimaryKey: true },
      { name: 'name', type: 'text', description: 'Season name (e.g., "2023-2024")', nullable: false },
      { name: 'start_date', type: 'date', description: 'Season start date', nullable: false },
      { name: 'end_date', type: 'date', description: 'Season end date', nullable: false },
      { name: 'is_current', type: 'boolean', description: 'Whether this is the current season', nullable: false },
    ],
    exampleQueries: [
      'Show all seasons',
      'What is the current season?',
      'List seasons by year'
    ]
  },
  {
    name: 'unusual_matches_view',
    description: 'View highlighting matches with unusual or notable statistics',
    columns: [
      { name: 'id', type: 'uuid', description: 'Match identifier', nullable: false },
      { name: 'date', type: 'timestamptz', description: 'Match date', nullable: false },
      { name: 'home_team', type: 'text', description: 'Home team', nullable: false },
      { name: 'away_team', type: 'text', description: 'Away team', nullable: false },
      { name: 'home_goals', type: 'integer', description: 'Home goals', nullable: false },
      { name: 'away_goals', type: 'integer', description: 'Away goals', nullable: false },
      { name: 'goal_difference', type: 'integer', description: 'Goal difference', nullable: false },
      { name: 'total_goals', type: 'integer', description: 'Total goals in match', nullable: false },
      { name: 'unusual_type', type: 'text', description: 'Type of unusual statistic', nullable: true },
      { name: 'season', type: 'text', description: 'Season name', nullable: false },
    ],
    exampleQueries: [
      'Show me unusual matches',
      'Find the biggest upsets',
      'What are the most surprising results?'
    ]
  }
];

export class SchemaEmbeddings {
  private vectorStore: Chroma | null = null;
  private embeddings: OpenAIEmbeddings;
  private initialized: boolean = false;
  private apiKey: string;

  constructor(apiKey?: string) {
    // Try localStorage first, then env variable, then passed parameter
    const storedKey = typeof window !== 'undefined' ? localStorage.getItem('openai_api_key') : null;
    const openAIApiKey = storedKey || apiKey || import.meta.env.VITE_OPENAI_API_KEY || '';
    this.apiKey = openAIApiKey;
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey,
      modelName: 'text-embedding-3-small' // Updated model
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔍 Initializing schema embeddings...');
      
      // Create documents from schema
      const documents = this.createSchemaDocuments();
      console.log(`📄 Created ${documents.length} schema documents`);
      
      // Check if we have OpenAI API key
      if (!this.apiKey || this.apiKey === '') {
        console.warn('⚠️ No OpenAI API key found - using fallback text search');
        this.initialized = true;
        return;
      }
      
      // Initialize Chroma vector store with persistent collection
      this.vectorStore = new Chroma(this.embeddings, {
        collectionName: 'sql-ball-schema',
        url: undefined, // Use in-memory for now since we don't have server running
        numDimensions: 1536, // Dimension for text-embedding-3-small
      });
      
      // Add documents to the vector store
      await this.vectorStore.addDocuments(documents);
      
      console.log('✅ Schema embeddings initialized successfully!');
      this.initialized = true;
      
    } catch (error) {
      console.error('❌ Failed to initialize schema embeddings:', error);
      // Continue without vector search - use fallback methods
      this.initialized = true;
    }
  }

  private createSchemaDocuments(): Document[] {
    const documents: Document[] = [];

    MATCH_DATABASE_SCHEMA.forEach(table => {
      // Create document for table
      documents.push(new Document({
        pageContent: `Table: ${table.name}\nDescription: ${table.description}\nColumns: ${table.columns.map(c => c.name).join(', ')}`,
        metadata: {
          type: 'table',
          tableName: table.name,
          description: table.description
        }
      }));

      // Create documents for columns
      table.columns.forEach(column => {
        documents.push(new Document({
          pageContent: `Column: ${table.name}.${column.name}\nType: ${column.type}\nDescription: ${column.description}`,
          metadata: {
            type: 'column',
            tableName: table.name,
            columnName: column.name,
            dataType: column.type,
            isPrimaryKey: column.isPrimaryKey || false,
            isForeignKey: column.isForeignKey || false
          }
        }));
      });

      // Create documents for example queries
      if (table.exampleQueries) {
        table.exampleQueries.forEach(query => {
          documents.push(new Document({
            pageContent: `Example query for ${table.name}: ${query}`,
            metadata: {
              type: 'example',
              tableName: table.name,
              query: query
            }
          }));
        });
      }
    });

    return documents;
  }

  async searchSchema(query: string, k: number = 5): Promise<Document[]> {
    await this.initialize();
    
    if (!this.vectorStore) {
      // Fallback: Simple text-based search
      console.log('🔍 Using fallback text search (no vector store)');
      return this.fallbackTextSearch(query, k);
    }
    
    try {
      const results = await this.vectorStore.similaritySearch(query, k);
      console.log(`🎯 Found ${results.length} relevant schema matches`);
      return results;
    } catch (error) {
      console.error('Vector search failed, using fallback:', error);
      return this.fallbackTextSearch(query, k);
    }
  }

  private fallbackTextSearch(query: string, k: number = 5): Document[] {
    const documents = this.createSchemaDocuments();
    const queryLower = query.toLowerCase();
    
    // Score documents based on text similarity
    const scoredDocs = documents.map(doc => {
      const content = doc.pageContent.toLowerCase();
      const metadata = JSON.stringify(doc.metadata).toLowerCase();
      
      let score = 0;
      
      // Exact word matches get higher scores
      const queryWords = queryLower.split(' ');
      queryWords.forEach(word => {
        if (word.length > 2) { // Ignore short words
          if (content.includes(word)) score += 3;
          if (metadata.includes(word)) score += 2;
        }
      });
      
      // Partial matches
      if (content.includes(queryLower)) score += 5;
      
      return { doc, score };
    });
    
    // Sort by score and return top k
    return scoredDocs
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(item => item.doc);
  }

  async getRelevantTables(query: string): Promise<string[]> {
    const results = await this.searchSchema(query);
    const tables = new Set<string>();
    
    results.forEach(doc => {
      if (doc.metadata.tableName) {
        tables.add(doc.metadata.tableName);
      }
    });
    
    return Array.from(tables);
  }

  async getTableSchema(tableName: string): Promise<TableSchema | undefined> {
    return MATCH_DATABASE_SCHEMA.find(table => table.name === tableName);
  }
}