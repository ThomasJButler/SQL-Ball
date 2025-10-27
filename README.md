# SQL-Ball

Football analytics platform that converts natural language questions into SQL queries and visualises European league match data.

## What It Does

Ask questions about football in plain English, get SQL queries back. Works across 22 European leagues with 7,600+ matches.

- Natural language to SQL conversion ("Show me upsets in the Premier League")
- Interactive dashboards with trends and anomaly detection
- LangChain RAG backend for query parsing and schema context retrieval
- Real-time visualisations via Chart.js

## Setup

**Frontend:**
```bash
npm install
npm run dev  # http://localhost:5173
```

**Backend:**
```bash
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py  # http://localhost:8000
```

First time: run `./backend/setup.sh` to create venv and install dependencies.

**Environment Variables:**

Create `.env` in root and `backend/`:

```bash
# Frontend .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_API_BASE_URL=your_backend_url
VITE_OPENAI_API_KEY=optional_openai_key

# Backend .env
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
CHROMA_URL=your_chromadb_url
```

## Tech Stack

- **Frontend:** Svelte + TypeScript + Tailwind + Chart.js
- **Backend:** FastAPI + LangChain + ChromaDB + OpenAI
- **Database:** Supabase (PostgreSQL)

Data flow: NL query → backend RAG → schema embedding retrieval → SQL generation → validation → execution → visualisation.

## Common Issues

- **"No API key configured"** - Add `VITE_OPENAI_API_KEY` to `.env`. Fallback template generation still works.
- **"Failed to initialise ChromaDB"** - Check `chromadb_data/` is writable. Clear and restart if schema changed.
- **Empty query results** - Verify league codes (E0 = Premier League, SP1 = La Liga). Most data is 2024-2025 season.

## Deployment

- **Frontend:** Vercel (see [vercel.json](vercel.json))
- **Backend:** Render/Railway (see [render.yaml](render.yaml))
- **Database:** Supabase Cloud

Set environment variables in deployment platform settings. 

## Data

Match data from [football-data.co.uk](https://www.football-data.co.uk/data.php) covering 22 European leagues across 11 countries (England, Spain, Germany, Italy, France, Netherlands, Belgium, Portugal, Turkey, Greece, Scotland).

## Contributing

Issues and PRs welcome. Open an issue first for major changes.

---

Built for CodeCademy Mastering Generative AI for Developers bootcamp (August-September 2025).
