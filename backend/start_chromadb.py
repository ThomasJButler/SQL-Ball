#!/usr/bin/env python3
"""
@author Tom Butler
@date 2025-10-21
@description Initialises and manages persistent ChromaDB instance for SQL-Ball.
             Creates data directory, initialises client, and provides logging for embeddings lifecycle.
"""

import os
import sys
import time
import logging
from pathlib import Path
import chromadb
from chromadb.config import Settings

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def start_chromadb_server():
    """Start ChromaDB server programmatically"""
    logger.info("Starting ChromaDB server for SQL-Ball...")

    # Create data directory
    data_path = Path("./chromadb_data")
    data_path.mkdir(exist_ok=True)

    try:
        logger.info("Initialising ChromaDB with persistent storage...")

        # Create ChromaDB client with persistent storage
        client = chromadb.PersistentClient(
            path=str(data_path)
        )

        logger.info("ChromaDB initialised successfully!")
        logger.info("SQL-Ball RAG system ready for vector embeddings")
        logger.info(f"Data stored in: {data_path.absolute()}")

        # Test the client
        collections = client.list_collections()
        logger.info(f"Current collections: {len(collections)}")

        return client

    except Exception as e:
        logger.error(f"Failed to initialise ChromaDB: {e}")
        return None

if __name__ == "__main__":
    client = start_chromadb_server()
    if client:
        try:
            logger.info("ChromaDB is ready for SQL-Ball!")
            logger.info("Use this client for vector embeddings in your application")

            # Keep the script running to maintain client
            logger.info("Press Ctrl+C to exit")
            while True:
                time.sleep(1)

        except KeyboardInterrupt:
            logger.info("ChromaDB client stopped")
    else:
        logger.error("Failed to start ChromaDB")
        sys.exit(1)