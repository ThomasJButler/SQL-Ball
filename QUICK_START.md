# SQL-Ball Quick Start Guide 🚀

Welcome to SQL-Ball! A RAG-powered football analytics platform that converts natural language questions into SQL queries.

## 🎯 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment Variables

Create `.env` files:

**Root `.env`:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key
```

**Backend `.env`:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_key
```

### 3. Start the Application

```bash
# Terminal 1: Start Backend
cd backend
source .venv/bin/activate
uvicorn main:app --reload

# Terminal 2: Start Frontend
npm run dev
```

Visit http://localhost:5173 to see the app!

## 🔥 Features

### Natural Language to SQL
Ask questions in plain English:
- "Show me the top 5 scorers"
- "Which teams have the best home record?"
- "Find all strikers with more than 10 goals"

### Football-Specific Understanding
The system understands football terminology:
- **Positions**: striker, midfielder, goalkeeper, defender
- **Concepts**: clean sheet, hat trick, assist, big six teams
- **Stats**: xG (expected goals), form, goal contributions

### Pattern Discovery
- Discover unusual match statistics
- Find performance anomalies
- Analyse historical trends
- NO predictions - only historical analysis

## 📊 Example Queries

### Player Performance
```
"Who scored the most goals this season?"
"Show me players overperforming their xG"
"List midfielders with most assists"
```

### Team Analytics
```
"Arsenal's recent matches"
"Teams with best defensive record"
"Big six head-to-head results"
```

### Match Patterns
```
"Highest scoring matches"
"Games with most red cards"
"Matches where underdogs won"
```

## 🛠️ Tech Stack

- **Frontend**: Svelte + TypeScript + Tailwind CSS
- **Backend**: FastAPI + LangChain + ChromaDB
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 for SQL generation
- **RAG**: Vector embeddings of database schema

## 📝 Database Schema

- **teams**: Premier League teams with Elo ratings
- **players**: All players with positions and team codes
- **matches**: Match results with xG statistics
- **player_stats**: FPL points and performance data
- **player_match_stats**: Individual match performances

## 🚀 Advanced Features

### Query Optimisation
The system suggests SQL optimisations:
- Index usage recommendations
- Query structure improvements
- Performance estimates

### Learning Mode
- Explanations for generated SQL
- Step-by-step query breakdown
- SQL best practices

### Visual Query Builder
- Drag-and-drop interface
- Schema visualisation
- Query history

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Kill existing processes
lsof -ti:8000 | xargs kill -9

# Reset ChromaDB
cd backend
rm -rf chroma_db
mkdir chroma_db
```

### Import Errors
```bash
# Ensure you're in venv
which python3  # Should show .venv path

# Reinstall dependencies
pip install -r requirements.txt
```

### No Results
- Check season filter (default: 2024-2025)
- Verify Supabase connection
- Ensure tables have data

## 📚 Resources

- [Project Documentation](./README.md)
- [API Documentation](http://localhost:8000/docs)
- [Supabase Dashboard](https://app.supabase.com)

## 🎮 Demo Mode

Try these queries to see the system in action:

1. **Top Scorers**: "Show me the top 5 scorers"
2. **Team Form**: "Which teams are in best form?"
3. **Player Stats**: "Goalkeepers with most clean sheets"
4. **Match Analysis**: "High-scoring matches over 5 goals"
5. **Advanced**: "Players overperforming their expected goals"

## 🏆 Competition Entry

Built for the Codecademy GenAI Bootcamp Contest #1
- Focus: Historical data analysis
- NO predictions or betting features
- Pure football analytics with RAG

---

**Need help?** Check the console for detailed logs or see the troubleshooting section above.

**Enjoy exploring football data with SQL-Ball!** ⚽️🎯