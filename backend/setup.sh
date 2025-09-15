#!/bin/bash

# Setup script for SQL-Ball backend on macOS

echo "🚀 Setting up SQL-Ball backend..."

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Upgrade pip first
echo "Upgrading pip..."
python3 -m pip install --upgrade pip

# Install requirements
echo "Installing dependencies..."
python3 -m pip install fastapi==0.104.1
python3 -m pip install uvicorn[standard]==0.24.0
python3 -m pip install langchain==0.1.0
python3 -m pip install langchain-openai==0.0.2
python3 -m pip install chromadb==0.4.22
python3 -m pip install supabase==2.3.0
python3 -m pip install python-dotenv==1.0.0
python3 -m pip install pydantic==2.5.3
python3 -m pip install pandas==2.1.4
python3 -m pip install numpy==1.26.2
python3 -m pip install python-multipart==0.0.6

echo "✅ Backend setup complete!"
echo ""
echo "To run the backend:"
echo "  cd backend"
echo "  source .venv/bin/activate"
echo "  uvicorn main:app --reload --port 8000"