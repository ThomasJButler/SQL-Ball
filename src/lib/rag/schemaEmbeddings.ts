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

  constructor(apiKey?: string) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-ada-002'
    });
  }

  async initialize() {
    // Create documents from schema
    const documents = this.createSchemaDocuments();
    
    // Initialize Chroma vector store
    this.vectorStore = await Chroma.fromDocuments(
      documents,
      this.embeddings,
      {
        collectionName: 'sql-ball-schema',
        url: 'http://localhost:8000', // Default Chroma URL
      }
    );
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

  async searchSchema(query: string, k: number = 5) {
    if (!this.vectorStore) {
      await this.initialize();
    }
    
    const results = await this.vectorStore!.similaritySearch(query, k);
    return results;
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