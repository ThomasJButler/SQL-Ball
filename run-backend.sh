#!/bin/bash

echo "🚀 Starting SQL-Ball Backend..."
echo "================================"

cd backend

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

echo "✅ Virtual environment activated"
echo "📦 Starting FastAPI server..."
echo ""
echo "Backend will be available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo ""

# Run the server
uvicorn main:app --reload --port 8000