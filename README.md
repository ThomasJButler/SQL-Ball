# SQL-Ball

Football analytics platform that converts natural language questions into SQL queries, processes European league match data, and visualises patterns and statistics.

## What It Does

SQL-Ball lets you:
- Ask questions about football matches in plain English ("Show me upsets in the Premier League")
- Get automated SQL query generation and execution
- View interactive dashboards with historical trends, team performance, and statistical anomalies
- Explore data across 22 European leagues with 7,600+ matches

The backend uses LangChain RAG (Retrieval-Augmented Generation) to parse queries and retrieve relevant schema context. The frontend provides real-time visualisations via Chart.js.

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase project (free tier works)
- OpenAI or Anthropic API key (optional, for AI features)

### Installation

**Frontend:**
```bash
npm install
npm run dev
```

Runs on `http://localhost:5173` by default.

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Runs on `http://localhost:8000`.

**Environment Variables**

Create `.env` files in both root and `backend/` directories:

```
# Frontend .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_OPENAI_API_KEY=your_openai_key  # Optional
```

```
# Backend .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_OPENAI_API_KEY=your_openai_key
```

## Architecture

**Frontend Stack**
- Svelte + Vite for rapid development
- Chart.js for visualisations
- TypeScript for type safety
- Tailwind CSS for styling

**Backend Stack**
- FastAPI for HTTP API
- LangChain for RAG and SQL generation
- ChromaDB for vector embeddings
- Supabase PostgreSQL for data

**Data Flow**
1. User types natural language question
2. Frontend sends to backend `/query` endpoint
3. Backend retrieves schema context via embeddings
4. LLM generates SQL with OpenAI/Anthropic
5. SQL validation and repair layer handles edge cases
6. Query executes via Supabase RPC
7. Results return with explanation

## Common Issues

**"No API key configured"**
- Add `VITE_OPENAI_API_KEY` to `.env` for AI features
- Platform still works with template-based query generation

**"Failed to initialise ChromaDB"**
- Ensure `backend/.venv` is activated
- Check `chromadb_data/` directory is writable
- Clear directory and restart if schema changed

**Queries returning empty results**
- Verify league code is correct (E0 = Premier League, SP1 = La Liga, etc.)
- Check match_date format in WHERE clause
- Most data is 2024-2025 season

## Deployment

**Vercel (Frontend)**
```bash
npm run build
# Deploy dist/ folder to Vercel
```

Set environment variables in Vercel project settings.

**Backend Options**
- Railway.app (easiest)
- Heroku (cost-free tier removed)
- Self-hosted VPS

Backend needs environment variables set on deployment platform.

## Tech Details

**Why This Stack?**

- Svelte: Smaller bundle than React, excellent for data visualisations
- FastAPI: Modern Python async framework, auto-generates OpenAPI docs
- LangChain: Handles complex RAG pipelines without reinventing the wheel
- Supabase: PostgreSQL advantage for complex queries, real-time capabilities
- ChromaDB: Lightweight embedding store, no external dependency

**Performance Notes**

- Initial schema embedding takes ~2-3 seconds
- Subsequent queries cache embeddings in memory
- Vector search dramatically improves context retrieval
- Falls back to text search if embeddings unavailable

## Data Source

Match data sourced from [football-data.co.uk](https://www.football-data.co.uk/data.php).

Covers:
- Premier League, Championship, League One, League Two (England)
- La Liga, Segunda División (Spain)
- Bundesliga, 2. Bundesliga (Germany)
- Serie A, Serie B (Italy)
- Ligue 1, Ligue 2 (France)
- Eredivisie (Netherlands)
- Pro League (Belgium)
- Primeira Liga (Portugal)
- Süper Lig (Turkey)
- Super League (Greece)
- Premiership, Championship, League One, League Two (Scotland)

## Contributing

Issues and pull requests welcome. For major changes, open an issue first to discuss.

## License

See [LICENSE](LICENSE) file for details.

---

Built as a CodeCademy Mastering Generative AI for Developers bootcamp project (August-September 2025).
