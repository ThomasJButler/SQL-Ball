"""
@author Tom Butler
@date 2025-10-21
@description FastAPI backend server for SQL-Ball. Initialises RAG components (schema embeddings,
             SQL chain, football terminology mapper) on startup. Configures CORS and exposes
             API routers for query processing, optimisation, and execution.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our modules (we'll create these next)
from rag.embeddings import SchemaEmbedder
from rag.chain import SQLChain
from rag.football import FootballTermMapper
from api.query import query_router, set_dependencies as set_query_deps
from api.optimize import optimize_router, set_sql_chain
from api.execute import execute_router

# Initialize FastAPI app
app = FastAPI(
    title="SQL-Ball API",
    description="Convert natural language to SQL for football analytics",
    version="1.0.0"
)

# Configure CORS for Svelte frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:4173",  # Vite dev and preview
        "https://*.vercel.app",   # Vercel preview deployments
        "https://sql-ball.vercel.app",  # Production domain (update with your actual domain)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
schema_embedder = None
sql_chain = None
football_mapper = None

@app.on_event("startup")
async def startup_event():
    """Initialize RAG components on startup"""
    global schema_embedder, sql_chain, football_mapper

    print("Initialising SQL-Ball RAG system...")

    # Initialize schema embedder
    schema_embedder = SchemaEmbedder()
    await schema_embedder.initialize()

    # Initialize football terminology mapper
    football_mapper = FootballTermMapper()

    # Initialize SQL chain
    sql_chain = SQLChain(schema_embedder, football_mapper)

    # Set dependencies for routers
    set_query_deps(sql_chain, schema_embedder)
    set_sql_chain(sql_chain)

    print("RAG system initialised successfully!")

# Include routers
app.include_router(query_router, prefix="/api")
app.include_router(optimize_router, prefix="/api")
app.include_router(execute_router, prefix="/api")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SQL-Ball API",
        "rag_initialized": sql_chain is not None
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "SQL-Ball API - Football Analytics RAG System",
        "endpoints": {
            "/api/query": "Convert natural language to SQL",
            "/api/execute": "Execute SQL queries",
            "/api/optimize": "Optimize SQL queries",
            "/api/schema": "Get database schema",
            "/api/patterns": "Discover patterns in data",
            "/health": "Health check",
            "/docs": "API documentation"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
