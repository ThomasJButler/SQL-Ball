"""
@author Tom Butler
@date 2025-10-21
@description Vector embeddings manager for database schema using ChromaDB. Creates semantic
             embeddings of table/column definitions, enables similarity search for relevant
             schema context, and provides fallback text-based search for RAG retrieval.
"""

import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict, Any
import json
from supabase import create_client, Client
import os

class SchemaEmbedder:
    def __init__(self):
        # Use environment variable for persistent directory, fallback to local
        chroma_path = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
        self.chroma_client = chromadb.PersistentClient(path=chroma_path)
        self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
        self.collection = None
        supabase_url = os.getenv("VITE_SUPABASE_URL")
        supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
        
        self.supabase: Client | None = None
        if supabase_url and supabase_key:
            self.supabase = create_client(supabase_url, supabase_key)

    async def initialize(self):
        """Initialize ChromaDB collection with schema embeddings"""
        # Create or get collection
        self.collection = self.chroma_client.get_or_create_collection(
            name="sql_ball_schema",
            embedding_function=self.embedding_function
        )

        # Check if already embedded
        existing = self.collection.count()
        if existing > 0:
            print(f"Found {existing} existing schema embeddings")
            return

        print("Creating schema embeddings...")
        await self._embed_schema()

    async def _embed_schema(self):
        """Embed the database schema into ChromaDB"""

        # Define our schema with football context - simplified for real database
        schema_definitions = [
            # Matches table - core table with basic match data
            {
                "id": "matches_table",
                "document": "matches table contains match results with columns: id, match_date, home_team, away_team, home_score, away_score, result (H/A/D), div (league division like E0 for Premier League)",
                "metadata": {
                    "table": "matches",
                    "type": "table",
                    "columns": ["id", "match_date", "home_team", "away_team", "home_score", "away_score", "result", "div"],
                    "aliases": ["games", "fixtures", "results", "match_data"]
                }
            },
            # Teams basic info
            {
                "id": "teams_concept",
                "document": "Teams are referenced by name in matches table. Common teams include Arsenal, Chelsea, Liverpool, Manchester City, Manchester United, Tottenham, etc.",
                "metadata": {
                    "concept": "teams",
                    "type": "concept",
                    "columns": ["home_team", "away_team"],
                    "aliases": ["clubs", "football clubs", "team names"]
                }
            },
            # League divisions
            {
                "id": "divisions_concept", 
                "document": "League divisions: E0=Premier League, E1=Championship, E2=League One, E3=League Two, SP1=La Liga, I1=Serie A, D1=Bundesliga, F1=Ligue 1",
                "metadata": {
                    "concept": "divisions",
                    "type": "concept", 
                    "column": "div",
                    "aliases": ["leagues", "competitions", "divisions"]
                }
            }
        ]

        # Add column-specific embeddings for better search
        column_definitions = [
            {
                "id": "xg_column",
                "document": "xG or expected goals measures the quality of chances, ranging from 0 to 1 representing probability of scoring",
                "metadata": {
                    "column": "xg",
                    "tables": ["matches", "player_match_stats"],
                    "type": "metric",
                    "aliases": ["expected goals", "xG", "chance quality"]
                }
            },
            {
                "id": "clean_sheet",
                "document": "clean sheet means no goals conceded, found by checking goals_conceded = 0 or (for matches) away_score = 0 when home team",
                "metadata": {
                    "concept": "clean_sheet",
                    "query_pattern": "goals_conceded = 0",
                    "type": "concept"
                }
            },
            {
                "id": "position_striker",
                "document": "striker or forward players have position = 'FWD' in the players table",
                "metadata": {
                    "concept": "striker",
                    "query_pattern": "position = 'FWD'",
                    "type": "position",
                    "aliases": ["striker", "forward", "attacker", "number 9"]
                }
            },
            {
                "id": "big_six",
                "document": "big six teams are Arsenal, Chelsea, Liverpool, Manchester City, Manchester United, Tottenham",
                "metadata": {
                    "concept": "big_six",
                    "query_pattern": "team IN ('Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Man Utd', 'Tottenham')",
                    "type": "team_group"
                }
            }
        ]

        # Add all embeddings to ChromaDB
        all_definitions = schema_definitions + column_definitions

        # Convert lists in metadata to JSON strings for ChromaDB compatibility
        processed_metadatas = []
        for d in all_definitions:
            metadata = {}
            for key, value in d["metadata"].items():
                if isinstance(value, list):
                    metadata[key] = json.dumps(value)  # Convert lists to JSON strings
                else:
                    metadata[key] = value
            processed_metadatas.append(metadata)

        self.collection.add(
            ids=[d["id"] for d in all_definitions],
            documents=[d["document"] for d in all_definitions],
            metadatas=processed_metadatas
        )

        print(f"Created {len(all_definitions)} schema embeddings")

    def search_schema(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant schema elements based on query"""
        if not self.collection:
            return []

        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )

        # Format results
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'id': results['ids'][0][i],
                'document': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i] if 'distances' in results else None
            })

        return formatted_results

    async def get_table_schema(self, table_name: str) -> Dict[str, Any]:
        """Get detailed schema for a specific table from Supabase"""
        try:
            # Query information schema
            query = f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = '{table_name}'
                ORDER BY ordinal_position
            """

            result = self.supabase.rpc('get_schema', {'query': query}).execute()

            return {
                'table': table_name,
                'columns': result.data if result.data else []
            }
        except:
            # Fallback to predefined schema
            return self._get_predefined_schema(table_name)

    def _get_predefined_schema(self, table_name: str) -> Dict[str, Any]:
        """Fallback schema definitions"""
        schemas = {
            'teams': ['id', 'code', 'name', 'short_name', 'season', 'elo', 'strength'],
            'players': ['id', 'player_id', 'web_name', 'position', 'team_code', 'season'],
            'matches': ['id', 'gameweek', 'home_team', 'away_team', 'home_score', 'away_score', 'home_xg', 'away_xg', 'season'],
            'player_stats': ['id', 'player_id', 'gameweek', 'total_points', 'goals_scored', 'assists', 'season'],
            'player_match_stats': ['id', 'player_id', 'gameweek', 'minutes_played', 'goals', 'assists', 'xg', 'season']
        }

        return {
            'table': table_name,
            'columns': schemas.get(table_name, [])
        }
