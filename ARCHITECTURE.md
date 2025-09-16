# SQL-Ball Architecture Documentation

## Overview
SQL-Ball is a football analytics platform with a hybrid architecture that leverages both direct database access and a sophisticated RAG (Retrieval-Augmented Generation) backend for natural language processing.

## Architecture Pattern: Hybrid Client-Server

### 1. Frontend (Svelte + TypeScript)
The frontend application serves as the primary user interface, built with:
- **Svelte Framework** for reactive UI components
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Chart.js** for data visualizations

### 2. Backend API (FastAPI + Python)
The backend provides RAG capabilities and advanced processing:
- **FastAPI** for REST API endpoints
- **LangChain** for RAG pipeline
- **ChromaDB** for vector embeddings
- **OpenAI GPT-4** for natural language to SQL conversion

### 3. Database (Supabase/PostgreSQL)
Primary data storage with two access patterns:
- **Direct Access** via Supabase JS Client
- **API-mediated Access** via backend for complex queries

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│                   (Svelte Frontend)                      │
└────────────────┬───────────────────┬────────────────────┘
                 │                   │
     ┌───────────▼──────────┐    ┌──▼──────────────────┐
     │   Direct Queries     │    │   RAG Queries       │
     │  (Simple CRUD)       │    │  (Natural Language) │
     └───────────┬──────────┘    └──┬──────────────────┘
                 │                   │
                 │              ┌────▼────────────────┐
                 │              │   Backend API       │
                 │              │   (FastAPI)         │
                 │              └────┬────────────────┘
                 │                   │
     ┌───────────▼───────────────────▼────────────────┐
     │            Supabase (PostgreSQL)               │
     │         - matches                              │
     │         - player_stats                         │
     │         - seasons                              │
     └─────────────────────────────────────────────────┘
```

## Service Layer Design

### Frontend Services

#### 1. `apiService.ts`
Handles all backend API communication:
- Natural language to SQL conversion
- Query optimization
- Pattern discovery
- Schema information

#### 2. `supabase.ts`
Direct database access for:
- Recent matches
- Quick stats
- Basic CRUD operations
- Real-time subscriptions

### Backend Services

#### 1. RAG Pipeline (`/backend/rag/`)
- **SchemaEmbedder**: Embeds database schema for context
- **SQLChain**: Converts natural language to SQL
- **FootballTermMapper**: Maps football terminology

#### 2. API Endpoints (`/backend/api/`)
- `/api/query`: Natural language to SQL conversion
- `/api/optimize`: SQL query optimization
- `/api/patterns`: Pattern discovery in data
- `/api/schema`: Database schema information

## Component Architecture

### Key Components

1. **Dashboard** (`Dashboard.svelte`)
   - Direct Supabase queries for performance
   - Shows recent matches, quick stats
   - Integrates visualizations

2. **QueryBuilder** (`QueryBuilder.svelte`)
   - Uses backend API primarily
   - Fallback to direct OpenAI if backend unavailable
   - Executes SQL via Supabase RPC

3. **EnhancedVisualizations** (`EnhancedVisualizations.svelte`)
   - Processes data from Supabase
   - Multiple chart types
   - Seasonal data filtering

## Configuration

### Environment Variables

#### Frontend (.env)
```
VITE_SUPABASE_URL          # Supabase project URL
VITE_SUPABASE_ANON_KEY     # Supabase anonymous key
VITE_API_BASE_URL          # Backend API URL
VITE_OPENAI_API_KEY        # Optional fallback
```

#### Backend (.env)
```
OPENAI_API_KEY             # For RAG processing
SUPABASE_URL               # For query execution
SUPABASE_SERVICE_KEY       # Service role key
CHROMA_URL                 # Vector database URL
```

## Data Access Patterns

### Pattern 1: Direct Database Access
**When to use:**
- Simple SELECT queries
- Dashboard data fetching
- Real-time subscriptions
- Basic CRUD operations

**Benefits:**
- Lower latency
- Reduced server load
- Real-time capabilities
- Simpler error handling

### Pattern 2: API-Mediated Access
**When to use:**
- Natural language queries
- Complex query generation
- Query optimization needed
- Pattern discovery
- Learning mode with explanations

**Benefits:**
- Advanced NLP capabilities
- Query optimization
- Caching opportunities
- Centralized business logic

## Security Considerations

1. **Row Level Security (RLS)**
   - All tables have RLS policies
   - Public read access for demo data
   - Write operations require authentication

2. **API Keys**
   - Supabase anon key for public operations
   - Service key only on backend
   - OpenAI key stored securely

3. **CORS Configuration**
   - Backend configured for frontend origins
   - Prevents unauthorized API access

## Performance Optimizations

1. **Caching Strategy**
   - Frontend caches recent queries
   - Backend caches schema embeddings
   - Supabase handles query result caching

2. **Query Optimization**
   - Automatic LIMIT clauses
   - Index usage recommendations
   - Query execution planning

3. **Lazy Loading**
   - Components load data on demand
   - Pagination for large datasets
   - Progressive enhancement

## Deployment Architecture

### Development Environment
```
Frontend: http://localhost:5173 (Vite dev server)
Backend:  http://localhost:8000 (FastAPI/Uvicorn)
Database: Supabase Cloud
ChromaDB: http://localhost:8000 (embedded or standalone)
```

### Production Environment
```
Frontend: Vercel/Netlify (Static hosting)
Backend:  Cloud Run/Railway (Container hosting)
Database: Supabase Cloud
ChromaDB: Persistent volume or managed service
```

## Error Handling

### Frontend
- Graceful degradation when backend unavailable
- Fallback to direct OpenAI API
- User-friendly error messages
- Retry logic for transient failures

### Backend
- Structured error responses
- Detailed logging
- Circuit breaker pattern
- Health check endpoints

## Testing Strategy

### Unit Tests
- Component testing with Vitest
- Service layer mocking
- API endpoint testing

### Integration Tests
- End-to-end query flow
- Database operations
- RAG pipeline validation

### Performance Tests
- Query response times
- Concurrent user handling
- Resource utilization

## Future Enhancements

1. **Real-time Features**
   - Live match updates
   - Collaborative queries
   - Streaming results

2. **Advanced Analytics**
   - Machine learning predictions
   - Advanced pattern recognition
   - Custom metric creation

3. **Multi-tenancy**
   - User authentication
   - Personalized dashboards
   - Query history

4. **Optimization**
   - Query result caching
   - Precomputed aggregations
   - CDN integration

## Maintenance

### Regular Tasks
- Update dependencies
- Refresh embeddings
- Monitor API usage
- Database maintenance

### Monitoring
- API response times
- Error rates
- Database performance
- User analytics

## Contributing
See CONTRIBUTING.md for development setup and guidelines.

## License
MIT License - See LICENSE file for details.
