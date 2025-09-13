# Complete Claude Code Agent Orchestration & Git Strategy Guide

## Git Branching Strategy with Agent Coordination

```bash
# Initialize repository with complete branch structure
claude "Initialize git repository with feature branch strategy:
git init
git checkout -b main
git checkout -b develop
git checkout -b feature/rag-implementation
git checkout -b feature/sql-engine
git checkout -b feature/ui-components
git checkout -b feature/optimization-engine
git checkout -b feature/testing-suite
git checkout -b hotfix/emergency
git checkout -b release/v1.0.0

Create .gitignore:
```
*.pyc
__pycache__/
.env
*.log
.DS_Store
data/embeddings/
data/cache/
*.db
.pytest_cache/
.coverage
htmlcov/
dist/
build/
*.egg-info/
.streamlit/
.chroma/
```

Create pre-commit hooks in .pre-commit-config.yaml:
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
  - repo: https://github.com/psf/black
    rev: 24.3.0
    hooks:
      - id: black
  - repo: https://github.com/PyCQA/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
  - repo: https://github.com/PyCQA/isort
    rev: 5.13.2
    hooks:
      - id: isort
```

Setup git flow aliases in .gitmessage:
```
# <type>: <subject>

# <body>

# <footer>

# Type: feat|fix|docs|style|refactor|test|chore
# Subject: Summary in present tense
# Body: Explain what and why vs. how
# Footer: Issues closed, breaking changes
```"
```

## Master Orchestration Command System

```bash
# ULTIMATE MASTER COMMAND - Creates entire project in parallel
claude "MASTER ORCHESTRATOR: Execute complete SQL Query Buddy RAG system development

PARALLEL EXECUTION STRATEGY:
- Spawn 10 specialized agents working simultaneously
- Each agent owns specific branch and domain
- Coordinate via shared interfaces
- Merge upon completion verification

AGENT MANIFEST:

AGENT_1_INFRASTRUCTURE [branch: feature/infrastructure]:
```bash
#!/bin/bash
# Create complete project structure
mkdir -p {src/{rag,sql,agents,ui/{components,styles},database,utils,tests/fixtures},data/{schemas,embeddings,cache},scripts,notebooks,docs,.github/workflows}

# Create all configuration files
cat > .env.template << 'EOF'
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
DATABASE_URL=sqlite:///data/sample.db
CHROMA_PERSIST_DIRECTORY=./data/chroma
STREAMLIT_PORT=8501
LOG_LEVEL=INFO
CACHE_TTL=3600
MAX_RETRIES=3
EMBEDDING_MODEL=text-embedding-3-large
LLM_MODEL=gpt-4-turbo-preview
TEMPERATURE=0
MAX_TOKENS=2000
EOF

cat > requirements.txt << 'EOF'
streamlit==1.32.0
langchain==0.2.0
langchain-community==0.2.0
langchain-openai==0.1.7
chromadb==0.4.24
sqlalchemy==2.0.29
pandas==2.2.1
plotly==5.19.0
sqlglot==23.0.0
sql-metadata==2.11.0
python-dotenv==1.0.1
pydantic==2.6.3
numpy==1.26.4
scikit-learn==1.4.1
sentence-transformers==2.5.1
torch==2.2.1
pytest==8.1.1
pytest-cov==4.1.0
pytest-asyncio==0.23.5
black==24.2.0
flake8==7.0.0
isort==5.13.2
pre-commit==3.6.2
uvicorn==0.27.1
fastapi==0.110.0
redis==5.0.2
celery==5.3.6
prometheus-client==0.20.0
tenacity==8.2.3
tqdm==4.66.2
colorama==0.4.6
rich==13.7.1
EOF

cat > Dockerfile << 'EOF'
FROM python:3.11-slim as builder
WORKDIR /app
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
EXPOSE 8501 8000
HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health
CMD ["streamlit", "run", "src/ui/streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
EOF

cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8501:8501"
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://user:pass@db:5432/sqlbuddy
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - sqlbuddy-net

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: sqlbuddy
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - sqlbuddy-net

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    networks:
      - sqlbuddy-net

  chroma:
    image: chromadb/chroma
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma
    networks:
      - sqlbuddy-net

volumes:
  postgres_data:
  chroma_data:

networks:
  sqlbuddy-net:
    driver: bridge
EOF

cat > Makefile << 'EOF'
.PHONY: help install dev test lint format clean docker-up docker-down deploy

help:
	@echo "Available commands:"
	@echo "  install    Install dependencies"
	@echo "  dev        Run development server"
	@echo "  test       Run tests"
	@echo "  lint       Run linters"
	@echo "  format     Format code"
	@echo "  clean      Clean cache files"
	@echo "  docker-up  Start Docker services"
	@echo "  docker-down Stop Docker services"
	@echo "  deploy     Deploy to production"

install:
	pip install -r requirements.txt
	pre-commit install

dev:
	streamlit run src/ui/streamlit_app.py

test:
	pytest tests/ -v --cov=src --cov-report=html

lint:
	flake8 src/ tests/
	black --check src/ tests/
	isort --check-only src/ tests/

format:
	black src/ tests/
	isort src/ tests/

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov/

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

deploy:
	./scripts/deploy.sh
EOF

cat > setup.py << 'EOF'
from setuptools import setup, find_packages

setup(
    name="sql-query-buddy",
    version="1.0.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.11",
    install_requires=open("requirements.txt").read().splitlines(),
    entry_points={
        "console_scripts": [
            "sqlbuddy=main:main",
        ],
    },
)
EOF
```

AGENT_2_RAG_SYSTEM [branch: feature/rag-implementation]:
```python
# src/rag/__init__.py
from .embeddings import EmbeddingManager
from .vectorstore import ChromaVectorStore
from .retriever import SemanticRetriever
from .chains import RAGChain

__all__ = ['EmbeddingManager', 'ChromaVectorStore', 'SemanticRetriever', 'RAGChain']
```

```python
# src/rag/embeddings.py
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer
import torch
from dataclasses import dataclass, field
import hashlib
import pickle
from pathlib import Path
import logging
from functools import lru_cache
import asyncio
from concurrent.futures import ThreadPoolExecutor
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

@dataclass
class EmbeddingConfig:
    model_name: str = 'text-embedding-3-large'
    dimension: int = 3072
    batch_size: int = 32
    cache_dir: Path = field(default_factory=lambda: Path('data/embeddings'))
    use_gpu: bool = field(default_factory=torch.cuda.is_available)
    normalize: bool = True
    max_seq_length: int = 8192
    pool_size: int = 4

class EmbeddingManager:
    def __init__(self, config: EmbeddingConfig):
        self.config = config
        self.config.cache_dir.mkdir(parents=True, exist_ok=True)
        self._init_models()
        self._cache = {}
        self.executor = ThreadPoolExecutor(max_workers=config.pool_size)
        
    def _init_models(self):
        try:
            self.openai_embeddings = OpenAIEmbeddings(
                model=self.config.model_name,
                chunk_size=self.config.batch_size
            )
        except:
            logger.warning("OpenAI embeddings unavailable, falling back to local model")
            self.openai_embeddings = None
            
        self.local_embeddings = SentenceTransformer(
            'all-MiniLM-L6-v2',
            device='cuda' if self.config.use_gpu else 'cpu'
        )
        
        self.hf_embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2",
            model_kwargs={'device': 'cuda' if self.config.use_gpu else 'cpu'},
            encode_kwargs={'normalize_embeddings': self.config.normalize}
        )
    
    @lru_cache(maxsize=10000)
    def _get_cache_key(self, text: str) -> str:
        return hashlib.md5(text.encode()).hexdigest()
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def embed_text_async(self, text: str, use_cache: bool = True) -> np.ndarray:
        if use_cache:
            cache_key = self._get_cache_key(text)
            if cache_key in self._cache:
                return self._cache[cache_key]
            
            cache_file = self.config.cache_dir / f"{cache_key}.pkl"
            if cache_file.exists():
                with open(cache_file, 'rb') as f:
                    embedding = pickle.load(f)
                    self._cache[cache_key] = embedding
                    return embedding
        
        try:
            if self.openai_embeddings:
                embedding = await asyncio.get_event_loop().run_in_executor(
                    self.executor,
                    self.openai_embeddings.embed_query,
                    text
                )
            else:
                embedding = self.local_embeddings.encode(
                    text,
                    normalize_embeddings=self.config.normalize,
                    show_progress_bar=False
                )
        except Exception as e:
            logger.error(f"Embedding failed: {e}, using fallback")
            embedding = self.hf_embeddings.embed_query(text)
        
        embedding = np.array(embedding)
        
        if use_cache:
            self._cache[cache_key] = embedding
            cache_file = self.config.cache_dir / f"{cache_key}.pkl"
            with open(cache_file, 'wb') as f:
                pickle.dump(embedding, f)
        
        return embedding
    
    def embed_batch(self, texts: List[str], show_progress: bool = True) -> List[np.ndarray]:
        from tqdm import tqdm
        
        embeddings = []
        batch_texts = []
        cached_indices = []
        
        for i, text in enumerate(texts):
            cache_key = self._get_cache_key(text)
            if cache_key in self._cache:
                embeddings.append(self._cache[cache_key])
                cached_indices.append(i)
            else:
                batch_texts.append(text)
        
        if batch_texts:
            if self.openai_embeddings:
                new_embeddings = self.openai_embeddings.embed_documents(batch_texts)
            else:
                new_embeddings = self.local_embeddings.encode(
                    batch_texts,
                    batch_size=self.config.batch_size,
                    normalize_embeddings=self.config.normalize,
                    show_progress_bar=show_progress
                )
            
            j = 0
            for i in range(len(texts)):
                if i not in cached_indices:
                    embedding = np.array(new_embeddings[j])
                    embeddings.insert(i, embedding)
                    cache_key = self._get_cache_key(texts[i])
                    self._cache[cache_key] = embedding
                    j += 1
        
        return embeddings
    
    def compute_similarity(self, query_embedding: np.ndarray, doc_embeddings: List[np.ndarray]) -> np.ndarray:
        query_norm = query_embedding / np.linalg.norm(query_embedding)
        doc_norms = [d / np.linalg.norm(d) for d in doc_embeddings]
        similarities = np.dot(doc_norms, query_norm)
        return similarities
```

```python
# src/rag/vectorstore.py
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from dataclasses import dataclass
import logging
from datetime import datetime
import json
from pathlib import Path
import uuid

logger = logging.getLogger(__name__)

@dataclass
class VectorStoreConfig:
    collection_name: str = "sql_metadata"
    persist_directory: str = "./data/chroma"
    distance_metric: str = "cosine"
    hnsw_space: str = "cosine"
    hnsw_construction_ef: int = 200
    hnsw_search_ef: int = 100
    hnsw_M: int = 32
    hnsw_num_threads: int = 4
    batch_size: int = 100

class ChromaVectorStore:
    def __init__(self, config: VectorStoreConfig, embedding_manager):
        self.config = config
        self.embedding_manager = embedding_manager
        self._init_client()
        self._init_collection()
        
    def _init_client(self):
        self.client = chromadb.PersistentClient(
            path=self.config.persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
    
    def _init_collection(self):
        embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.getenv("OPENAI_API_KEY"),
            model_name="text-embedding-3-large"
        )
        
        metadata = {
            "hnsw:space": self.config.hnsw_space,
            "hnsw:construction_ef": self.config.hnsw_construction_ef,
            "hnsw:search_ef": self.config.hnsw_search_ef,
            "hnsw:M": self.config.hnsw_M,
            "hnsw:num_threads": self.config.hnsw_num_threads
        }
        
        try:
            self.collection = self.client.get_collection(
                name=self.config.collection_name,
                embedding_function=embedding_function
            )
            logger.info(f"Loaded existing collection: {self.config.collection_name}")
        except:
            self.collection = self.client.create_collection(
                name=self.config.collection_name,
                embedding_function=embedding_function,
                metadata=metadata
            )
            logger.info(f"Created new collection: {self.config.collection_name}")
    
    def add_documents(self, documents: List[Dict[str, Any]], batch_process: bool = True):
        if batch_process and len(documents) > self.config.batch_size:
            for i in range(0, len(documents), self.config.batch_size):
                batch = documents[i:i + self.config.batch_size]
                self._add_batch(batch)
        else:
            self._add_batch(documents)
    
    def _add_batch(self, documents: List[Dict[str, Any]]):
        ids = []
        texts = []
        metadatas = []
        
        for doc in documents:
            doc_id = doc.get('id', str(uuid.uuid4()))
            text = doc['content']
            metadata = doc.get('metadata', {})
            metadata['added_at'] = datetime.now().isoformat()
            
            ids.append(doc_id)
            texts.append(text)
            metadatas.append(metadata)
        
        self.collection.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )
        logger.info(f"Added {len(documents)} documents to collection")
    
    def search(self, query: str, k: int = 5, filter_dict: Optional[Dict] = None, 
              rerank: bool = True) -> List[Dict[str, Any]]:
        
        where_clause = filter_dict if filter_dict else None
        
        results = self.collection.query(
            query_texts=[query],
            n_results=k * 2 if rerank else k,
            where=where_clause,
            include=['documents', 'metadatas', 'distances']
        )
        
        if not results['documents'][0]:
            return []
        
        search_results = []
        for i, doc in enumerate(results['documents'][0]):
            search_results.append({
                'content': doc,
                'metadata': results['metadatas'][0][i],
                'score': 1 - results['distances'][0][i],
                'id': results['ids'][0][i] if 'ids' in results else None
            })
        
        if rerank:
            search_results = self._rerank_results(query, search_results, k)
        
        return search_results[:k]
    
    def _rerank_results(self, query: str, results: List[Dict], k: int) -> List[Dict]:
        from sentence_transformers import CrossEncoder
        
        cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        
        pairs = [[query, r['content']] for r in results]
        scores = cross_encoder.predict(pairs)
        
        for i, score in enumerate(scores):
            results[i]['rerank_score'] = float(score)
            results[i]['final_score'] = (results[i]['score'] + float(score)) / 2
        
        results.sort(key=lambda x: x['final_score'], reverse=True)
        return results
    
    def update_document(self, doc_id: str, new_content: str, new_metadata: Dict = None):
        self.collection.update(
            ids=[doc_id],
            documents=[new_content],
            metadatas=[new_metadata] if new_metadata else None
        )
    
    def delete_documents(self, doc_ids: List[str]):
        self.collection.delete(ids=doc_ids)
    
    def get_collection_stats(self) -> Dict[str, Any]:
        count = self.collection.count()
        return {
            'document_count': count,
            'collection_name': self.config.collection_name,
            'persist_directory': self.config.persist_directory,
            'distance_metric': self.config.distance_metric
        }
```

```python
# src/rag/retriever.py
from typing import List, Dict, Any, Optional, Callable
import numpy as np
from dataclasses import dataclass
import logging
from .vectorstore import ChromaVectorStore
from .embeddings import EmbeddingManager
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

@dataclass
class RetrieverConfig:
    top_k: int = 5
    similarity_threshold: float = 0.7
    use_mmr: bool = True
    mmr_lambda: float = 0.5
    use_hyde: bool = False
    max_context_length: int = 4000
    chunk_overlap: int = 200

class SemanticRetriever:
    def __init__(self, vectorstore: ChromaVectorStore, embedding_manager: EmbeddingManager, 
                 config: RetrieverConfig):
        self.vectorstore = vectorstore
        self.embedding_manager = embedding_manager
        self.config = config
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    async def retrieve_async(self, query: str, filter_dict: Optional[Dict] = None) -> List[Dict]:
        if self.config.use_hyde:
            query = await self._generate_hyde_query(query)
        
        results = await asyncio.get_event_loop().run_in_executor(
            self.executor,
            self.vectorstore.search,
            query,
            self.config.top_k * 2,
            filter_dict,
            True
        )
        
        filtered_results = [
            r for r in results 
            if r['final_score'] >= self.config.similarity_threshold
        ]
        
        if self.config.use_mmr:
            filtered_results = self._apply_mmr(query, filtered_results)
        
        return filtered_results[:self.config.top_k]
    
    def retrieve(self, query: str, filter_dict: Optional[Dict] = None) -> List[Dict]:
        return asyncio.run(self.retrieve_async(query, filter_dict))
    
    async def _generate_hyde_query(self, query: str) -> str:
        from langchain_openai import ChatOpenAI
        
        llm = ChatOpenAI(temperature=0.7)
        hyde_prompt = f"""Given this question about SQL databases, generate a hypothetical perfect answer 
        that would contain the information needed. Focus on technical details and schema information.
        
        Question: {query}
        
        Hypothetical Answer:"""
        
        response = await llm.ainvoke(hyde_prompt)
        return f"{query} {response.content}"
    
    def _apply_mmr(self, query: str, results: List[Dict]) -> List[Dict]:
        if len(results) <= 1:
            return results
        
        query_embedding = self.embedding_manager.embed_batch([query])[0]
        doc_embeddings = self.embedding_manager.embed_batch([r['content'] for r in results])
        
        selected = []
        selected_embeddings = []
        remaining = list(range(len(results)))
        
        first_idx = np.argmax([results[i]['final_score'] for i in remaining])
        selected.append(results[remaining[first_idx]])
        selected_embeddings.append(doc_embeddings[remaining[first_idx]])
        remaining.remove(remaining[first_idx])
        
        while remaining and len(selected) < self.config.top_k:
            scores = []
            for idx in remaining:
                relevance = results[idx]['final_score']
                
                similarities = [
                    np.dot(doc_embeddings[idx], sel_emb) / 
                    (np.linalg.norm(doc_embeddings[idx]) * np.linalg.norm(sel_emb))
                    for sel_emb in selected_embeddings
                ]
                max_similarity = max(similarities) if similarities else 0
                
                mmr_score = (self.config.mmr_lambda * relevance - 
                           (1 - self.config.mmr_lambda) * max_similarity)
                scores.append(mmr_score)
            
            best_idx = remaining[np.argmax(scores)]
            selected.append(results[best_idx])
            selected_embeddings.append(doc_embeddings[best_idx])
            remaining.remove(best_idx)
        
        return selected
    
    def create_context(self, retrieved_docs: List[Dict]) -> str:
        context_parts = []
        current_length = 0
        
        for doc in retrieved_docs:
            content = doc['content']
            metadata = doc.get('metadata', {})
            
            doc_text = f"Table: {metadata.get('table_name', 'Unknown')}\n"
            doc_text += f"Description: {metadata.get('description', '')}\n"
            doc_text += f"Content: {content}\n"
            doc_text += "-" * 40 + "\n"
            
            if current_length + len(doc_text) > self.config.max_context_length:
                break
            
            context_parts.append(doc_text)
            current_length += len(doc_text)
        
        return "\n".join(context_parts)
```

```python
# src/rag/chains.py
from langchain.chains import create_sql_query_chain, create_sql_agent
from langchain_openai import ChatOpenAI
from langchain_community.utilities import SQLDatabase
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.schema import StrOutputParser
from langchain.callbacks import StreamingStdOutCallbackHandler
from typing import Dict, Any, Optional, List
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ChainConfig:
    model_name: str = "gpt-4-turbo-preview"
    temperature: float = 0
    max_tokens: int = 2000
    streaming: bool = True
    verbose: bool = True

class RAGChain:
    def __init__(self, retriever, database_uri: str, config: ChainConfig):
        self.retriever = retriever
        self.config = config
        self.llm = self._init_llm()
        self.db = SQLDatabase.from_uri(database_uri)
        self.query_chain = self._create_query_chain()
        self.explanation_chain = self._create_explanation_chain()
        self.optimization_chain = self._create_optimization_chain()
    
    def _init_llm(self):
        callbacks = [StreamingStdOutCallbackHandler()] if self.config.streaming else []
        
        return ChatOpenAI(
            model=self.config.model_name,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            callbacks=callbacks,
            streaming=self.config.streaming
        )
    
    def _create_query_chain(self):
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template("""You are an expert SQL query generator. 
            Given the database schema context and a natural language question, generate the appropriate SQL query.
            
            Database Context:
            {context}
            
            Important Rules:
            1. Use only tables and columns that exist in the context
            2. Prefer explicit column names over SELECT *
            3. Use appropriate JOINs for multi-table queries
            4. Add meaningful aliases for clarity
            5. Consider performance implications
            6. Include appropriate WHERE clauses for filtering
            7. Use aggregate functions when asking for summaries
            """),
            HumanMessagePromptTemplate.from_template("{question}")
        ])
        
        return create_sql_query_chain(self.llm, self.db, prompt=prompt)
    
    def _create_explanation_chain(self):
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template("""You are a SQL teacher explaining queries to beginners.
            Given a SQL query, provide a clear, step-by-step explanation.
            
            Format your explanation as:
            1. **Overview**: What the query does in simple terms
            2. **Step-by-step breakdown**: Explain each clause
            3. **Key concepts**: Define any SQL terms used
            4. **Example result**: What kind of data would be returned
            
            Use analogies and simple language. Avoid jargon where possible.
            """),
            HumanMessagePromptTemplate.from_template("Explain this SQL query:\n{query}")
        ])
        
        return prompt | self.llm | StrOutputParser()
    
    def _create_optimization_chain(self):
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template("""You are a database performance expert.
            Analyze the given SQL query and suggest optimizations.
            
            Consider:
            1. Index usage opportunities
            2. JOIN optimization (order, type)
            3. Subquery elimination
            4. Aggregate function optimization
            5. WHERE clause sargability
            6. Avoiding N+1 queries
            7. Proper use of DISTINCT/GROUP BY
            
            Provide:
            - Optimized query
            - Performance improvement estimate
            - Explanation of changes
            - Index recommendations
            """),
            HumanMessagePromptTemplate.from_template(
                "Original query:\n{query}\n\nSchema:\n{schema}"
            )
        ])
        
        return prompt | self.llm | StrOutputParser()
    
    async def generate_query(self, question: str, use_rag: bool = True) -> Dict[str, Any]:
        context = ""
        if use_rag:
            retrieved = await self.retriever.retrieve_async(question)
            context = self.retriever.create_context(retrieved)
        
        enhanced_question = f"{context}\n\nQuestion: {question}" if context else question
        
        try:
            sql_query = await self.query_chain.ainvoke({"question": enhanced_question})
            
            result = {
                'success': True,
                'query': sql_query,
                'context_used': context,
                'retrieved_tables': [doc.get('metadata', {}).get('table_name') 
                                    for doc in retrieved] if use_rag else []
            }
            
        except Exception as e:
            logger.error(f"Query generation failed: {e}")
            result = {
                'success': False,
                'error': str(e),
                'context_used': context
            }
        
        return result
    
    async def explain_query(self, query: str) -> str:
        return await self.explanation_chain.ainvoke({"query": query})
    
    async def optimize_query(self, query: str) -> Dict[str, Any]:
        schema_info = self.db.get_table_info()
        response = await self.optimization_chain.ainvoke({
            "query": query,
            "schema": schema_info
        })
        
        lines = response.split('\n')
        optimized_query = ""
        improvements = []
        explanation = ""
        
        section = ""
        for line in lines:
            if "OPTIMIZED QUERY:" in line.upper():
                section = "query"
            elif "IMPROVEMENTS:" in line.upper():
                section = "improvements"
            elif "EXPLANATION:" in line.upper():
                section = "explanation"
            elif section == "query" and line.strip():
                optimized_query += line + "\n"
            elif section == "improvements" and line.strip().startswith("-"):
                improvements.append(line.strip()[1:].strip())
            elif section == "explanation" and line.strip():
                explanation += line + "\n"
        
        return {
            'original': query,
            'optimized': optimized_query.strip(),
            'improvements': improvements,
            'explanation': explanation.strip()
        }
```

AGENT_3_SQL_ENGINE [branch: feature/sql-engine]:
```python
# src/sql/__init__.py
from .generator import SQLGenerator
from .optimizer import QueryOptimizer
from .executor import QueryExecutor
from .validator import SQLValidator

__all__ = ['SQLGenerator', 'QueryOptimizer', 'QueryExecutor', 'SQLValidator']
```

```python
# src/sql/generator.py
from typing import Dict, Any, List, Optional, Tuple
import sqlglot
from sqlglot import exp, parse_one, transpile
from dataclasses import dataclass
import re
import logging
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate

logger = logging.getLogger(__name__)

@dataclass
class GeneratorConfig:
    dialect: str = "sqlite"
    optimize: bool = True
    validate: bool = True
    max_query_length: int = 5000
    timeout: int = 30

class SQLGenerator:
    def __init__(self, config: GeneratorConfig, llm: Optional[ChatOpenAI] = None):
        self.config = config
        self.llm = llm or ChatOpenAI(temperature=0, model="gpt-4")
        self.patterns = self._compile_patterns()
        
    def _compile_patterns(self):
        return {
            'table_reference': re.compile(r'\b(?:FROM|JOIN)\s+(\w+)', re.IGNORECASE),
            'column_reference': re.compile(r'(?:SELECT|WHERE|GROUP BY|ORDER BY)\s+([^\s,]+)', re.IGNORECASE),
            'dangerous_ops': re.compile(r'\b(DROP|DELETE|TRUNCATE|ALTER)\b', re.IGNORECASE),
            'injection': re.compile(r'(;|--|\*|OR\s+1\s*=\s*1|UNION\s+SELECT)', re.IGNORECASE)
        }
    
    def generate_from_natural_language(self, 
                                      question: str, 
                                      schema_context: str,
                                      examples: List[Dict] = None) -> Dict[str, Any]:
        
        prompt = self._build_prompt(question, schema_context, examples)
        
        try:
            response = self.llm.invoke(prompt)
            sql = self._extract_sql(response.content)
            
            if self.config.validate:
                validation = self.validate_query(sql, schema_context)
                if not validation['valid']:
                    sql = self._fix_query(sql, validation['errors'], schema_context)
            
            if self.config.optimize:
                sql = self._optimize_query(sql)
            
            return {
                'success': True,
                'query': sql,
                'confidence': self._calculate_confidence(sql, question),
                'tables_used': self._extract_tables(sql),
                'complexity': self._assess_complexity(sql)
            }
            
        except Exception as e:
            logger.error(f"SQL generation failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'fallback_query': self._generate_fallback(question, schema_context)
            }
    
    def _build_prompt(self, question: str, schema: str, examples: List[Dict] = None) -> str:
        base_prompt = f"""Generate a SQL query for the following question.
        
        Database Schema:
        {schema}
        
        Question: {question}
        
        Requirements:
        1. Use only tables and columns from the schema
        2. Optimize for performance
        3. Be precise with JOIN conditions
        4. Handle NULL values appropriately
        5. Use appropriate aggregate functions
        """
        
        if examples:
            example_text = "\n\nExamples:\n"
            for ex in examples[:3]:
                example_text += f"Q: {ex['question']}\nSQL: {ex['sql']}\n\n"
            base_prompt += example_text
        
        base_prompt += "\nSQL Query:"
        return base_prompt
    
    def _extract_sql(self, response: str) -> str:
        sql_pattern = re.compile(r'```sql\n(.*?)\n```', re.DOTALL | re.IGNORECASE)
        match = sql_pattern.search(response)
        
        if match:
            return match.group(1).strip()
        
        lines = response.split('\n')
        sql_lines = []
        in_sql = False
        
        for line in lines:
            if any(keyword in line.upper() for keyword in ['SELECT', 'WITH', 'INSERT', 'UPDATE']):
                in_sql = True
            if in_sql:
                sql_lines.append(line)
                if ';' in line:
                    break
        
        return '\n'.join(sql_lines).strip()
    
    def validate_query(self, sql: str, schema: str) -> Dict[str, Any]:
        errors = []
        warnings = []
        
        if self.patterns['dangerous_ops'].search(sql):
            errors.append("Query contains potentially dangerous operations")
        
        if self.patterns['injection'].search(sql):
            errors.append("Potential SQL injection detected")
        
        try:
            parsed = parse_one(sql, dialect=self.config.dialect)
            
            tables_in_query = self._extract_tables(sql)
            tables_in_schema = self._extract_schema_tables(schema)
            
            invalid_tables = set(tables_in_query) - set(tables_in_schema)
            if invalid_tables:
                errors.append(f"Invalid tables: {', '.join(invalid_tables)}")
            
            if isinstance(parsed, exp.Select):
                if parsed.args.get('group'):
                    select_cols = [str(col) for col in parsed.args.get('expressions', [])]
                    group_cols = [str(col) for col in parsed.args.get('group').expressions]
                    
                    non_agg_cols = [col for col in select_cols 
                                   if not any(agg in col.upper() 
                                           for agg in ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'])]
                    
                    for col in non_agg_cols:
                        if col not in group_cols:
                            warnings.append(f"Column {col} not in GROUP BY")
            
        except Exception as e:
            errors.append(f"Parse error: {str(e)}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def _fix_query(self, sql: str, errors: List[str], schema: str) -> str:
        fix_prompt = f"""Fix the following SQL query based on the errors:
        
        Original Query:
        {sql}
        
        Errors:
        {chr(10).join(errors)}
        
        Schema:
        {schema}
        
        Fixed Query:"""
        
        response = self.llm.invoke(fix_prompt)
        return self._extract_sql(response.content)
    
    def _optimize_query(self, sql: str) -> str:
        try:
            optimized = sqlglot.optimize(
                parse_one(sql, dialect=self.config.dialect),
                dialect=self.config.dialect,
                rules=[
                    "eliminate_subqueries",
                    "merge_subqueries", 
                    "eliminate_joins",
                    "pushdown_predicates",
                    "optimize_joins"
                ]
            )
            return optimized.sql(dialect=self.config.dialect)
        except:
            return sql
    
    def _extract_tables(self, sql: str) -> List[str]:
        tables = []
        for match in self.patterns['table_reference'].finditer(sql):
            table = match.group(1)
            if table.upper() not in ['SELECT', 'WHERE', 'AND', 'OR']:
                tables.append(table)
        return list(set(tables))
    
    def _extract_schema_tables(self, schema: str) -> List[str]:
        table_pattern = re.compile(r'(?:TABLE|CREATE TABLE)\s+(\w+)', re.IGNORECASE)
        return [match.group(1) for match in table_pattern.finditer(schema)]
    
    def _calculate_confidence(self, sql: str, question: str) -> float:
        confidence = 1.0
        
        if 'JOIN' in sql.upper():
            confidence -= 0.1
        
        subquery_count = sql.upper().count('SELECT') - 1
        confidence -= subquery_count * 0.15
        
        if any(word in question.lower() for word in ['might', 'maybe', 'possibly', 'could']):
            confidence -= 0.2
        
        return max(0.1, min(1.0, confidence))
    
    def _assess_complexity(self, sql: str) -> str:
        score = 0
        
        score += sql.upper().count('JOIN') * 2
        score += sql.upper().count('SELECT') - 1
        score += sql.upper().count('CASE') * 2
        score += sql.upper().count('GROUP BY')
        score += sql.upper().count('HAVING')
        score += len(re.findall(r'\b(?:SUM|COUNT|AVG|MAX|MIN)\b', sql, re.IGNORECASE))
        
        if score <= 2:
            return "simple"
        elif score <= 5:
            return "moderate"
        else:
            return "complex"
    
    def _generate_fallback(self, question: str, schema: str) -> str:
        keywords = re.findall(r'\b\w+\b', question.lower())
        tables = self._extract_schema_tables(schema)
        
        relevant_table = None
        for table in tables:
            if any(keyword in table.lower() for keyword in keywords):
                relevant_table = table
                break
        
        if relevant_table:
            return f"SELECT * FROM {relevant_table} LIMIT 10"
        return "SELECT 'Unable to generate query' as message"
```

```python
# src/sql/optimizer.py
import sqlglot
from sqlglot import exp, parse_one, optimize
from typing import Dict, Any, List, Tuple, Optional
import re
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class OptimizationRule:
    name: str
    pattern: str
    suggestion: str
    severity: str
    auto_fix: bool = False

class QueryOptimizer:
    def __init__(self, schema_info: Dict[str, Any]):
        self.schema = schema_info
        self.rules = self._init_optimization_rules()
        self.index_suggestions = []
        
    def _init_optimization_rules(self) -> List[OptimizationRule]:
        return [
            OptimizationRule(
                "avoid_select_star",
                r"SELECT\s+\*",
                "Specify column names instead of SELECT *",
                "medium",
                True
            ),
            OptimizationRule(
                "use_exists_not_in",
                r"NOT\s+IN\s*\(",
                "Use NOT EXISTS instead of NOT IN for NULL safety",
                "high",
                True
            ),
            OptimizationRule(
                "avoid_or_in_where",
                r"WHERE.*\bOR\b",
                "Consider using UNION or IN for better index usage",
                "medium",
                False
            ),
            OptimizationRule(
                "function_on_indexed_column",
                r"WHERE\s+\w+\([^)]*\)",
                "Avoid functions on indexed columns in WHERE clause",
                "high",
                False
            ),
            OptimizationRule(
                "implicit_conversion",
                r"WHERE\s+\w+\s*=\s*'?\d+'?",
                "Ensure data types match to avoid implicit conversion",
                "medium",
                False
            ),
            OptimizationRule(
                "missing_index_hint",
                r"WHERE\s+(\w+)\s*=",
                "Consider adding index on frequently filtered columns",
                "low",
                False
            ),
            OptimizationRule(
                "cartesian_product",
                r"FROM\s+\w+\s*,\s*\w+",
                "Use explicit JOIN syntax instead of comma joins",
                "high",
                True
            ),
            OptimizationRule(
                "distinct_unnecessary",
                r"SELECT\s+DISTINCT.*GROUP\s+BY",
                "DISTINCT may be unnecessary with GROUP BY",
                "low",
                False
            )
        ]
    
    def optimize(self, query: str, explain_plan: Optional[Dict] = None) -> Dict[str, Any]:
        original_query = query
        issues = self._detect_issues(query)
        
        optimized_query = self._apply_optimizations(query)
        
        optimization_report = {
            'original': original_query,
            'optimized': optimized_query,
            'issues_found': issues,
            'improvements': self._calculate_improvements(original_query, optimized_query),
            'index_suggestions': self._suggest_indexes(query),
            'estimated_performance_gain': self._estimate_performance_gain(issues),
            'complexity_reduction': self._measure_complexity_reduction(original_query, optimized_query)
        }
        
        if explain_plan:
            optimization_report['execution_plan_analysis'] = self._analyze_execution_plan(explain_plan)
        
        return optimization_report
    
    def _detect_issues(self, query: str) -> List[Dict[str, Any]]:
        issues = []
        
        for rule in self.rules:
            if re.search(rule.pattern, query, re.IGNORECASE):
                issues.append({
                    'rule': rule.name,
                    'description': rule.suggestion,
                    'severity': rule.severity,
                    'can_auto_fix': rule.auto_fix,
                    'location': self._find_pattern_location(query, rule.pattern)
                })
        
        join_issues = self._analyze_join_order(query)
        if join_issues:
            issues.extend(join_issues)
        
        subquery_issues = self._analyze_subqueries(query)
        if subquery_issues:
            issues.extend(subquery_issues)
        
        return issues
    
    def _apply_optimizations(self, query: str) -> str:
        try:
            parsed = parse_one(query)
            
            optimized = optimize(
                parsed,
                rules=[
                    "eliminate_subqueries",
                    "merge_subqueries",
                    "eliminate_joins",
                    "pushdown_predicates",
                    "optimize_joins",
                    "eliminate_ctes",
                    "annotate_types"
                ]
            )
            
            optimized_sql = optimized.sql()
            
            optimized_sql = self._fix_select_star(optimized_sql)
            optimized_sql = self._fix_not_in(optimized_sql)
            optimized_sql = self._fix_comma_joins(optimized_sql)
            optimized_sql = self._optimize_aggregates(optimized_sql)
            
            return optimized_sql
            
        except Exception as e:
            logger.error(f"Optimization failed: {e}")
            return query
    
    def _fix_select_star(self, query: str) -> str:
        if 'SELECT *' not in query.upper():
            return query
        
        try:
            parsed = parse_one(query)
            
            if isinstance(parsed, exp.Select):
                tables = self._get_query_tables(parsed)
                
                if tables and len(tables) == 1:
                    table_name = tables[0]
                    if table_name in self.schema:
                        columns = self.schema[table_name].get('columns', [])
                        if columns:
                            column_list = ', '.join([f"{table_name}.{col}" for col in columns])
                            query = re.sub(r'SELECT\s+\*', f'SELECT {column_list}', query, flags=re.IGNORECASE)
            
        except:
            pass
        
        return query
    
    def _fix_not_in(self, query: str) -> str:
        pattern = r'(\w+)\s+NOT\s+IN\s*\(([^)]+)\)'
        
        def replace_not_in(match):
            column = match.group(1)
            subquery = match.group(2)
            
            if 'SELECT' in subquery.upper():
                return f"NOT EXISTS ({subquery} AND {column} = subquery_result)"
            else:
                values = subquery.split(',')
                conditions = [f"{column} != {v.strip()}" for v in values]
                return f"({' AND '.join(conditions)})"
        
        return re.sub(pattern, replace_not_in, query, flags=re.IGNORECASE)
    
    def _fix_comma_joins(self, query: str) -> str:
        pattern = r'FROM\s+(\w+)\s*,\s*(\w+)'
        
        def replace_comma_join(match):
            table1 = match.group(1)
            table2 = match.group(2)
            
            join_condition = self._infer_join_condition(table1, table2)
            
            if join_condition:
                return f"FROM {table1} INNER JOIN {table2} ON {join_condition}"
            else:
                return f"FROM {table1} CROSS JOIN {table2}"
        
        return re.sub(pattern, replace_comma_join, query, flags=re.IGNORECASE)
    
    def _optimize_aggregates(self, query: str) -> str:
        if 'COUNT(*)' in query.upper() and 'WHERE' in query.upper():
            if re.search(r'WHERE\s+\w+\s+IS\s+NOT\s+NULL', query, re.IGNORECASE):
                column = re.search(r'WHERE\s+(\w+)\s+IS\s+NOT\s+NULL', query, re.IGNORECASE).group(1)
                query = query.replace('COUNT(*)', f'COUNT({column})')
        
        if 'AVG(' in query.upper():
            query = re.sub(r'AVG\((\w+)\)', r'SUM(\1)::FLOAT / COUNT(\1)', query)
        
        return query
    
    def _analyze_join_order(self, query: str) -> List[Dict[str, Any]]:
        issues = []
        
        join_pattern = r'JOIN\s+(\w+)'
        joins = re.findall(join_pattern, query, re.IGNORECASE)
        
        if len(joins) > 2:
            optimal_order = self._calculate_optimal_join_order(joins)
            if optimal_order != joins:
                issues.append({
                    'rule': 'suboptimal_join_order',
                    'description': f"Consider reordering joins: {' -> '.join(optimal_order)}",
                    'severity': 'medium',
                    'can_auto_fix': False
                })
        
        return issues
    
    def _analyze_subqueries(self, query: str) -> List[Dict[str, Any]]:
        issues = []
        
        subquery_count = query.upper().count('SELECT') - 1
        
        if subquery_count > 0:
            if re.search(r'SELECT.*FROM\s*\(SELECT', query, re.IGNORECASE):
                issues.append({
                    'rule': 'nested_subquery',
                    'description': "Consider using CTEs or JOINs instead of nested subqueries",
                    'severity': 'medium',
                    'can_auto_fix': True
                })
            
            if re.search(r'WHERE.*IN\s*\(SELECT', query, re.IGNORECASE):
                issues.append({
                    'rule': 'subquery_in_where',
                    'description': "Consider using JOIN instead of IN (SELECT...)",
                    'severity': 'medium',
                    'can_auto_fix': True
                })
        
        return issues
    
    def _suggest_indexes(self, query: str) -> List[Dict[str, str]]:
        suggestions = []
        
        where_pattern = r'WHERE\s+(\w+)\s*[=<>]'
        where_columns = re.findall(where_pattern, query, re.IGNORECASE)
        
        for col in set(where_columns):
            suggestions.append({
                'type': 'btree',
                'column': col,
                'reason': 'Frequently used in WHERE clause',
                'estimated_impact': 'high'
            })
        
        join_pattern = r'ON\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)'
        join_columns = re.findall(join_pattern, query, re.IGNORECASE)
        
        for col_pair in join_columns:
            for col in col_pair:
                suggestions.append({
                    'type': 'btree',
                    'column': col,
                    'reason': 'Used in JOIN condition',
                    'estimated_impact': 'high'
                })
        
        order_pattern = r'ORDER\s+BY\s+(\w+)'
        order_columns = re.findall(order_pattern, query, re.IGNORECASE)
        
        for col in set(order_columns):
            suggestions.append({
                'type': 'btree',
                'column': col,
                'reason': 'Used in ORDER BY',
                'estimated_impact': 'medium'
            })
        
        return suggestions
    
    def _calculate_optimal_join_order(self, tables: List[str]) -> List[str]:
        table_stats = []
        
        for table in tables:
            if table in self.schema:
                stats = self.schema[table]
                table_stats.append({
                    'name': table,
                    'row_count': stats.get('row_count', 1000000),
                    'has_index': stats.get('has_index', False),
                    'selectivity': stats.get('selectivity', 1.0)
                })
            else:
                table_stats.append({
                    'name': table,
                    'row_count': 1000000,
                    'has_index': False,
                    'selectivity': 1.0
                })
        
        table_stats.sort(key=lambda x: x['row_count'] * x['selectivity'])
        
        return [t['name'] for t in table_stats]
    
    def _infer_join_condition(self, table1: str, table2: str) -> Optional[str]:
        if table1 in self.schema and table2 in self.schema:
            t1_cols = set(self.schema[table1].get('columns', []))
            t2_cols = set(self.schema[table2].get('columns', []))
            
            common_cols = t1_cols & t2_cols
            
            if 'id' in common_cols:
                return f"{table1}.id = {table2}.id"
            
            for col in common_cols:
                if col.endswith('_id'):
                    return f"{table1}.{col} = {table2}.{col}"
            
            if f"{table2}_id" in t1_cols:
                return f"{table1}.{table2}_id = {table2}.id"
            elif f"{table1}_id" in t2_cols:
                return f"{table2}.{table1}_id = {table1}.id"
        
        return None
    
    def _estimate_performance_gain(self, issues: List[Dict]) -> str:
        total_impact = 0
        
        severity_scores = {
            'high': 30,
            'medium': 15,
            'low': 5
        }
        
        for issue in issues:
            total_impact += severity_scores.get(issue['severity'], 0)
        
        if total_impact >= 60:
            return "50-70% faster"
        elif total_impact >= 30:
            return "20-40% faster"
        elif total_impact >= 10:
            return "5-15% faster"
        else:
            return "minimal improvement"
    
    def _measure_complexity_reduction(self, original: str, optimized: str) -> Dict[str, int]:
        return {
            'original_length': len(original),
            'optimized_length': len(optimized),
            'joins_reduced': original.upper().count('JOIN') - optimized.upper().count('JOIN'),
            'subqueries_eliminated': original.upper().count('SELECT') - optimized.upper().count('SELECT'),
            'conditions_simplified': original.upper().count('WHERE') - optimized.upper().count('WHERE')
        }
    
    def _find_pattern_location(self, query: str, pattern: str) -> Dict[str, int]:
        match = re.search(pattern, query, re.IGNORECASE)
        if match:
            return {
                'start': match.start(),
                'end': match.end(),
                'line': query[:match.start()].count('\n') + 1
            }
        return {'start': -1, 'end': -1, 'line': -1}
    
    def _analyze_execution_plan(self, plan: Dict) -> Dict[str, Any]:
        return {
            'total_cost': plan.get('total_cost', 0),
            'scan_type': plan.get('scan_type', 'unknown'),
            'rows_examined': plan.get('rows_examined', 0),
            'using_index': plan.get('using_index', False),
            'bottlenecks': plan.get('bottlenecks', [])
        }
    
    def _get_query_tables(self, parsed_query) -> List[str]:
        tables = []
        
        def extract_tables(node):
            if isinstance(node, exp.Table):
                tables.append(node.name)
            for child in node.args.values():
                if isinstance(child, list):
                    for item in child:
                        if isinstance(item, exp.Expression):
                            extract_tables(item)
                elif isinstance(child, exp.Expression):
                    extract_tables(child)
        
        extract_tables(parsed_query)
        return tables
    
    def _calculate_improvements(self, original: str, optimized: str) -> List[str]:
        improvements = []
        
        if 'SELECT *' in original and 'SELECT *' not in optimized:
            improvements.append("Replaced SELECT * with specific columns")
        
        if 'NOT IN' in original and 'NOT EXISTS' in optimized:
            improvements.append("Converted NOT IN to NOT EXISTS for NULL safety")
        
        if re.search(r'FROM\s+\w+\s*,\s*\w+', original) and 'JOIN' in optimized:
            improvements.append("Converted comma joins to explicit JOIN syntax")
        
        if original.count('SELECT') > optimized.count('SELECT'):
            improvements.append(f"Eliminated {original.count('SELECT') - optimized.count('SELECT')} subqueries")
        
        return improvements
```

```python
# src/sql/executor.py
import sqlalchemy
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.pool import QueuePool
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
import asyncio
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import time
import logging
from dataclasses import dataclass
from contextlib import contextmanager

logger = logging.getLogger(__name__)

@dataclass
class ExecutorConfig:
    max_retries: int = 3
    timeout: int = 30
    max_rows: int = 10000
    enable_cache: bool = True
    cache_ttl: int = 3600
    pool_size: int = 5
    max_overflow: int = 10

class QueryExecutor:
    def __init__(self, database_uri: str, config: ExecutorConfig):
        self.config = config
        self.engine = self._create_engine(database_uri)
        self.metadata = MetaData()
        self.cache = {}
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.query_history = []
        
    def _create_engine(self, uri: str):
        return create_engine(
            uri,
            poolclass=QueuePool,
            pool_size=self.config.pool_size,
            max_overflow=self.config.max_overflow,
            pool_recycle=3600,
            pool_pre_ping=True,
            echo=False
        )
    
    @contextmanager
    def get_connection(self):
        conn = self.engine.connect()
        try:
            yield conn
        finally:
            conn.close()
    
    def execute(self, query: str, parameters: Dict = None, 
               return_dataframe: bool = True) -> Dict[str, Any]:
        
        start_time = time.time()
        cache_key = self._get_cache_key(query, parameters)
        
        if self.config.enable_cache and cache_key in self.cache:
            cached = self.cache[cache_key]
            if time.time() - cached['timestamp'] < self.config.cache_ttl:
                logger.info("Returning cached result")
                return cached['result']
        
        result = self._execute_with_retry(query, parameters, return_dataframe)
        
        execution_time = time.time() - start_time
        
        self._record_query(query, parameters, execution_time, result['success'])
        
        if self.config.enable_cache and result['success']:
            self.cache[cache_key] = {
                'result': result,
                'timestamp': time.time()
            }
        
        result['execution_time'] = execution_time
        
        return result
    
    def _execute_with_retry(self, query: str, parameters: Dict = None, 
                          return_dataframe: bool = True) -> Dict[str, Any]:
        
        last_error = None
        
        for attempt in range(self.config.max_retries):
            try:
                if attempt > 0:
                    corrected_query = self._attempt_correction(query, last_error)
                    if corrected_query != query:
                        logger.info(f"Attempting corrected query (attempt {attempt + 1})")
                        query = corrected_query
                
                with self.get_connection() as conn:
                    future = self.executor.submit(
                        self._execute_query,
                        conn,
                        query,
                        parameters
                    )
                    
                    result = future.result(timeout=self.config.timeout)
                    
                    if return_dataframe and result:
                        df = pd.DataFrame(result)
                        
                        if len(df) > self.config.max_rows:
                            df = df.head(self.config.max_rows)
                            truncated = True
                        else:
                            truncated = False
                        
                        return {
                            'success': True,
                            'data': df,
                            'row_count': len(df),
                            'column_count': len(df.columns),
                            'columns': df.columns.tolist(),
                            'truncated': truncated,
                            'query': query
                        }
                    else:
                        return {
                            'success': True,
                            'data': result,
                            'row_count': len(result) if result else 0,
                            'query': query
                        }
                        
            except TimeoutError:
                last_error = "Query timeout"
                logger.warning(f"Query timeout on attempt {attempt + 1}")
                
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Query failed on attempt {attempt + 1}: {e}")
                
                if attempt == self.config.max_retries - 1:
                    return {
                        'success': False,
                        'error': str(e),
                        'error_type': type(e).__name__,
                        'query': query,
                        'attempts': attempt + 1
                    }
        
        return {
            'success': False,
            'error': last_error,
            'query': query,
            'attempts': self.config.max_retries
        }
    
    def _execute_query(self, conn, query: str, parameters: Dict = None):
        if parameters:
            result = conn.execute(text(query), parameters)
        else:
            result = conn.execute(text(query))
        
        if result.returns_rows:
            return result.fetchall()
        else:
            return {'affected_rows': result.rowcount}
    
    def _attempt_correction(self, query: str, error: str) -> str:
        corrections = {
            'no such table': self._fix_table_name,
            'no such column': self._fix_column_name,
            'syntax error': self._fix_syntax,
            'ambiguous column': self._fix_ambiguous_column,
            'division by zero': self._fix_division_by_zero
        }
        
        for error_pattern, fix_func in corrections.items():
            if error_pattern in error.lower():
                return fix_func(query, error)
        
        return query
    
    def _fix_table_name(self, query: str, error: str) -> str:
        import re
        
        table_match = re.search(r"no such table: (\w+)", error, re.IGNORECASE)
        if table_match:
            bad_table = table_match.group(1)
            
            with self.get_connection() as conn:
                inspector = sqlalchemy.inspect(conn)
                tables = inspector.get_table_names()
                
                from difflib import get_close_matches
                matches = get_close_matches(bad_table.lower(), 
                                          [t.lower() for t in tables], 
                                          n=1, cutoff=0.6)
                
                if matches:
                    correct_table = next(t for t in tables if t.lower() == matches[0])
                    return query.replace(bad_table, correct_table)
        
        return query
    
    def _fix_column_name(self, query: str, error: str) -> str:
        import re
        
        column_match = re.search(r"no such column: (\w+)", error, re.IGNORECASE)
        if column_match:
            bad_column = column_match.group(1)
            
            tables_in_query = re.findall(r'FROM\s+(\w+)|JOIN\s+(\w+)', query, re.IGNORECASE)
            tables = [t for pair in tables_in_query for t in pair if t]
            
            with self.get_connection() as conn:
                inspector = sqlalchemy.inspect(conn)
                
                for table in tables:
                    try:
                        columns = [col['name'] for col in inspector.get_columns(table)]
                        
                        from difflib import get_close_matches
                        matches = get_close_matches(bad_column.lower(),
                                                  [c.lower() for c in columns],
                                                  n=1, cutoff=0.6)
                        
                        if matches:
                            correct_column = next(c for c in columns if c.lower() == matches[0])
                            return query.replace(bad_column, correct_column)
                    except:
                        continue
        
        return query
    
    def _fix_syntax(self, query: str, error: str) -> str:
        fixes = [
            (r'(\w+)\s+form\s+', r'\1 FROM '),
            (r'SELCT\s+', 'SELECT '),
            (r'FORM\s+', 'FROM '),
            (r'WEHRE\s+', 'WHERE '),
            (r'GROPU\s+BY', 'GROUP BY'),
            (r'ODRER\s+BY', 'ORDER BY')
        ]
        
        import re
        for pattern, replacement in fixes:
            query = re.sub(pattern, replacement, query, flags=re.IGNORECASE)
        
        return query
    
    def _fix_ambiguous_column(self, query: str, error: str) -> str:
        import re
        
        column_match = re.search(r"column ['\"]?(\w+)['\"]? is ambiguous", error, re.IGNORECASE)
        if column_match:
            ambiguous_column = column_match.group(1)
            
            tables_in_query = re.findall(r'FROM\s+(\w+)|JOIN\s+(\w+)', query, re.IGNORECASE)
            tables = [t for pair in tables_in_query for t in pair if t]
            
            if tables:
                query = re.sub(f'\\b{ambiguous_column}\\b',
                             f'{tables[0]}.{ambiguous_column}',
                             query)
        
        return query
    
    def _fix_division_by_zero(self, query: str, error: str) -> str:
        import re
        
        query = re.sub(r'(\w+)\s*/\s*(\w+)',
                      r'CASE WHEN \2 != 0 THEN \1 / \2 ELSE NULL END',
                      query)
        
        return query
    
    def _get_cache_key(self, query: str, parameters: Dict = None) -> str:
        import hashlib
        import json
        
        key_parts = [query]
        if parameters:
            key_parts.append(json.dumps(parameters, sort_keys=True))
        
        key_string = '|'.join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _record_query(self, query: str, parameters: Dict, 
                     execution_time: float, success: bool):
        
        self.query_history.append({
            'query': query,
            'parameters': parameters,
            'execution_time': execution_time,
            'success': success,
            'timestamp': time.time()
        })
        
        if len(self.query_history) > 1000:
            self.query_history = self.query_history[-1000:]
    
    async def execute_async(self, query: str, parameters: Dict = None) -> Dict[str, Any]:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            self.execute,
            query,
            parameters
        )
    
    def execute_batch(self, queries: List[str]) -> List[Dict[str, Any]]:
        results = []
        
        with self.get_connection() as conn:
            trans = conn.begin()
            
            try:
                for query in queries:
                    result = self._execute_query(conn, query)
                    results.append({
                        'query': query,
                        'success': True,
                        'result': result
                    })
                
                trans.commit()
                
            except Exception as e:
                trans.rollback()
                logger.error(f"Batch execution failed: {e}")
                
                for i in range(len(results), len(queries)):
                    results.append({
                        'query': queries[i],
                        'success': False,
                        'error': str(e)
                    })
        
        return results
    
    def get_query_stats(self) -> Dict[str, Any]:
        if not self.query_history:
            return {'total_queries': 0}
        
        successful = [q for q in self.query_history if q['success']]
        failed = [q for q in self.query_history if not q['success']]
        
        return {
            'total_queries': len(self.query_history),
            'successful_queries': len(successful),
            'failed_queries': len(failed),
            'success_rate': len(successful) / len(self.query_history) if self.query_history else 0,
            'average_execution_time': sum(q['execution_time'] for q in self.query_history) / len(self.query_history),
            'cache_size': len(self.cache),
            'recent_queries': self.query_history[-10:]
        }
```

```python
# src/sql/validator.py
import sqlglot
from sqlglot import parse_one, exp
import re
from typing import Dict, Any, List, Optional, Set
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ValidationRule:
    name: str
    check_function: callable
    severity: str
    message: str

class SQLValidator:
    def __init__(self, schema: Dict[str, Any], dialect: str = "sqlite"):
        self.schema = schema
        self.dialect = dialect
        self.rules = self._init_validation_rules()
        
    def _init_validation_rules(self) -> List[ValidationRule]:
        return [
            ValidationRule(
                "sql_injection",
                self._check_sql_injection,
                "critical",
                "Potential SQL injection detected"
            ),
            ValidationRule(
                "dangerous_operations",
                self._check_dangerous_operations,
                "critical",
                "Query contains dangerous operations"
            ),
            ValidationRule(
                "valid_tables",
                self._check_valid_tables,
                "error",
                "Query references invalid tables"
            ),
            ValidationRule(
                "valid_columns",
                self._check_valid_columns,
                "error",
                "Query references invalid columns"
            ),
            ValidationRule(
                "group_by_validity",
                self._check_group_by_validity,
                "error",
                "Invalid GROUP BY clause"
            ),
            ValidationRule(
                "aggregate_without_group",
                self._check_aggregate_without_group,
                "warning",
                "Aggregate function without GROUP BY"
            ),
            ValidationRule(
                "ambiguous_columns",
                self._check_ambiguous_columns,
                "error",
                "Ambiguous column references"
            ),
            ValidationRule(
                "data_type_mismatch",
                self._check_data_type_mismatch,
                "warning",
                "Potential data type mismatch"
            )
        ]
    
    def validate(self, query: str) -> Dict[str, Any]:
        errors = []
        warnings = []
        
        try:
            parsed = parse_one(query, dialect=self.dialect)
        except Exception as e:
            return {
                'valid': False,
                'errors': [{'rule': 'parse_error', 'message': str(e), 'severity': 'critical'}],
                'warnings': [],
                'parsed': None
            }
        
        for rule in self.rules:
            try:
                result = rule.check_function(query, parsed)
                if result:
                    issue = {
                        'rule': rule.name,
                        'message': rule.message,
                        'severity': rule.severity,
                        'details': result
                    }
                    
                    if rule.severity in ['critical', 'error']:
                        errors.append(issue)
                    else:
                        warnings.append(issue)
                        
            except Exception as e:
                logger.warning(f"Rule {rule.name} failed: {e}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'parsed': parsed,
            'complexity_score': self._calculate_complexity(parsed)
        }
    
    def _check_sql_injection(self, query: str, parsed) -> Optional[Dict]:
        dangerous_patterns = [
            r';\s*DROP',
            r';\s*DELETE',
            r';\s*UPDATE',
            r';\s*INSERT',
            r'--\s*',
            r'/\*.*\*/',
            r'OR\s+1\s*=\s*1',
            r'OR\s+\'1\'\s*=\s*\'1\'',
            r'UNION\s+SELECT.*NULL',
            r'EXEC\s*\(',
            r'EXECUTE\s+IMMEDIATE'
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                return {'pattern': pattern, 'location': re.search(pattern, query, re.IGNORECASE).span()}
        
        return None
    
    def _check_dangerous_operations(self, query: str, parsed) -> Optional[Dict]:
        dangerous_ops = ['DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE']
        
        def check_node(node):
            if hasattr(node, '__class__'):
                class_name = node.__class__.__name__.upper()
                if any(op in class_name for op in dangerous_ops):
                    return True
            
            for child in node.args.values():
                if isinstance(child, list):
                    for item in child:
                        if isinstance(item, exp.Expression) and check_node(item):
                            return True
                elif isinstance(child, exp.Expression) and check_node(child):
                    return True
            
            return False
        
        if check_node(parsed):
            return {'operations': [op for op in dangerous_ops if op in str(parsed).upper()]}
        
        return None
    
    def _check_valid_tables(self, query: str, parsed) -> Optional[Dict]:
        invalid_tables = []
        
        def extract_tables(node, tables=None):
            if tables is None:
                tables = set()
            
            if isinstance(node, exp.Table):
                table_name = node.name
                if table_name not in self.schema:
                    invalid_tables.append(table_name)
                tables.add(table_name)
            
            for child in node.args.values():
                if isinstance(child, list):
                    for item in child:
                        if isinstance(item, exp.Expression):
                            extract_tables(item, tables)
                elif isinstance(child, exp.Expression):
                    extract_tables(child, tables)
            
            return tables
        
        extract_tables(parsed)
        
        if invalid_tables:
            return {'invalid_tables': invalid_tables, 'available_tables': list(self.schema.keys())}
        
        return None
    
    def _check_valid_columns(self, query: str, parsed) -> Optional[Dict]:
        invalid_columns = []
        
        tables_in_query = self._get_query_tables(parsed)
        
        def check_columns(node):
            if isinstance(node, exp.Column):
                column_name = node.name
                table_name = node.table if hasattr(node, 'table') else None
                
                if table_name:
                    if table_name in self.schema:
                        valid_columns = self.schema[table_name].get('columns', [])
                        if column_name not in valid_columns:
                            invalid_columns.append(f"{table_name}.{column_name}")
                else:
                    found = False
                    for table in tables_in_query:
                        if table in self.schema:
                            if column_name in self.schema[table].get('columns', []):
                                found = True
                                break
                    
                    if not found and column_name != '*':
                        invalid_columns.append(column_name)
            
            for child in node.args.values():
                if isinstance(child, list):
                    for item in child:
                        if isinstance(item, exp.Expression):
                            check_columns(item)
                elif isinstance(child, exp.Expression):
                    check_columns(child)
        
        check_columns(parsed)
        
        if invalid_columns:
            return {'invalid_columns': invalid_columns}
        
        return None
    
    def _check_group_by_validity(self, query: str, parsed) -> Optional[Dict]:
        if not isinstance(parsed, exp.Select):
            return None
        
        group_by = parsed.args.get('group')
        if not group_by:
            return None
        
        select_expressions = parsed.args.get('expressions', [])
        group_by_expressions = group_by.expressions if hasattr(group_by, 'expressions') else []
        
        non_aggregated = []
        
        for expr in select_expressions:
            if not self._is_aggregate(expr) and not self._is_in_group_by(expr, group_by_expressions):
                non_aggregated.append(str(expr))
        
        if non_aggregated:
            return {'non_aggregated_columns': non_aggregated}
        
        return None
    
    def _check_aggregate_without_group(self, query: str, parsed) -> Optional[Dict]:
        if not isinstance(parsed, exp.Select):
            return None
        
        has_aggregate = False
        has_non_aggregate = False
        
        for expr in parsed.args.get('expressions', []):
            if self._is_aggregate(expr):
                has_aggregate = True
            else:
                has_non_aggregate = True
        
        if has_aggregate and has_non_aggregate and not parsed.args.get('group'):
            return {'message': 'Query mixes aggregate and non-aggregate columns without GROUP BY'}
        
        return None
    
    def _check_ambiguous_columns(self, query: str, parsed) -> Optional[Dict]:
        tables = self._get_query_tables(parsed)
        
        if len(tables) <= 1:
            return None
        
        ambiguous = []
        
        def check_columns(node):
            if isinstance(node, exp.Column):
                if not hasattr(node, 'table') or not node.table:
                    column_name = node.name
                    
                    count = 0
                    for table in tables:
                        if table in self.schema:
                            if column_name in self.schema[table].get('columns', []):
                                count += 1
                    
                    if count > 1:
                        ambiguous.append(column_name)
            
            for child in node.args.values():
                if isinstance(child, list):
                    for item in child:
                        if isinstance(item, exp.Expression):
                            check_columns(item)
                elif isinstance(child, exp.Expression):
                    check_columns(child)
        
        check_columns(parsed)
        
        if ambiguous:
            return {'ambiguous_columns': ambiguous}
        
        return None
    
    def _check_data_type_mismatch(self, query: str, parsed) -> Optional[Dict]:
        mismatches = []
        
        def check_comparisons(node):
            if isinstance(node, (exp.EQ, exp.NEQ, exp.LT, exp.LTE, exp.GT, exp.GTE)):
                left = node.args.get('this')
                right = node.args.get('expression')
                
                left_type = self._infer_type(left)
                right_type = self._infer_type(right)
                
                if left_type and right_type and left_type != right_type:
                    if not self._types_compatible(left_type, right_type):
                        mismatches.append({
                            'left': str(left),
                            'left_type': left_type,
                            'right': str(right),
                            'right_type': right_type
                        })
            
            for child in node.args.values():
                if isinstance(child, list):
                    for item in child:
                        if isinstance(item, exp.Expression):
                            check_comparisons(item)
                elif isinstance(child, exp.Expression):
                    check_comparisons(child)
        
        check_comparisons(parsed)
        
        if mismatches:
            return {'type_mismatches': mismatches}
        
        return None
    
    def _get_query_tables(self, parsed) -> Set[str]:
        tables = set()
        
        def extract_tables(node):
            if isinstance(node, exp.Table):
                tables.add(node.name)
            
            for child in node.args.values():
                if isinstance(child, list):
                    for item in child:
                        if isinstance(item, exp.Expression):
                            extract_tables(item)
                elif isinstance(child, exp.Expression):
                    extract_tables(child)
        
        extract_tables(parsed)
        return tables
    
    def _is_aggregate(self, expr) -> bool:
        aggregate_functions = ['COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'GROUP_CONCAT']
        
        def check_aggregate(node):
            if hasattr(node, '__class__'):
                class_name = node.__class__.__name__.upper()
                if any(func in class_name for func in aggregate_functions):
                    return True
            
            for child in node.args.values():
                if isinstance(child, list):
                    for item in child:
                        if isinstance(item, exp.Expression) and check_aggregate(item):
                            return True
                elif isinstance(child, exp.Expression) and check_aggregate(child):
                    return True
            
            return False
        
        return check_aggregate(expr)
    
    def _is_in_group_by(self, expr, group_by_expressions) -> bool:
        expr_str = str(expr).strip()
        
        for group_expr in group_by_expressions:
            if str(group_expr).strip() == expr_str:
                return True
        
        return False
    
    def _infer_type(self, expr) -> Optional[str]:
        if isinstance(expr, exp.Literal):
            if isinstance(expr, exp.Number):
                return 'numeric'
            elif isinstance(expr, exp.String):
                return 'string'
            elif isinstance(expr, exp.Boolean):
                return 'boolean'
        
        elif isinstance(expr, exp.Column):
            table_name = expr.table if hasattr(expr, 'table') else None
            column_name = expr.name
            
            if table_name and table_name in self.schema:
                columns = self.schema[table_name].get('column_types', {})
                return columns.get(column_name)
        
        return None
    
    def _types_compatible(self, type1: str, type2: str) -> bool:
        compatible_types = {
            'numeric': ['integer', 'float', 'decimal', 'numeric'],
            'string': ['varchar', 'text', 'char', 'string'],
            'date': ['date', 'datetime', 'timestamp'],
            'boolean': ['boolean', 'bool']
        }
        
        for group, types in compatible_types.items():
            if type1 in types and type2 in types:
                return True
        
        return False
    
    def _calculate_complexity(self, parsed) -> int:
        complexity = 0
        
        def calculate(node):
            nonlocal complexity
            
            if isinstance(node, exp.Select):
                complexity += 1
            elif isinstance(node, exp.Join):
                complexity += 2
            elif isinstance(node, exp.Subquery):
                complexity += 3
            elif isinstance(node, exp.Case):
                complexity += 2
            elif isinstance(node, (exp.Union, exp.Intersect, exp.Except)):
                complexity += 3
            
            for child in node.args.values():
                if isinstance(child, list):
                    for item in child:
                        if isinstance(item, exp.Expression):
                            calculate(item)
                elif isinstance(child, exp.Expression):
                    calculate(child)
        
        calculate(parsed)
        return complexity
```

AGENT_4_UI [branch: feature/ui-components]:
```python
# src/ui/streamlit_app.py
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from config import Config
from rag import RAGChain, SemanticRetriever, ChromaVectorStore, EmbeddingManager
from sql import SQLGenerator, QueryOptimizer, QueryExecutor, SQLValidator
from agents import QueryAgent, OptimizationAgent, ExplanationAgent, Orchestrator
from database import DatabaseConnector, MetadataExtractor
from utils import setup_logging, MetricsCollector

logger = setup_logging(__name__)

st.set_page_config(
    page_title="SQL Query Buddy - AI Contest",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded",
    menu_items={
        'Get Help': 'https://github.com/yourusername/sql-query-buddy',
        'Report a bug': 'https://github.com/yourusername/sql-query-buddy/issues',
        'About': 'SQL Query Buddy - Generative AI Contest 2025 Entry'
    }
)

st.markdown("""
<style>
    .main {
        padding: 0rem 1rem;
    }
    .stButton>button {
        background-color: #4CAF50;
        color: white;
        font-weight: bold;
        border-radius: 5px;
        border: none;
        padding: 0.5rem 1rem;
        transition: all 0.3s;
    }
    .stButton>button:hover {
        background-color: #45a049;
        transform: scale(1.05);
    }
    .success-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
    }
    .error-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
    }
    .warning-box {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
        color: #856404;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 10px;
        color: white;
        margin: 0.5rem 0;
    }
    .chat-message {
        padding: 1rem;
        border-radius: 10px;
        margin: 0.5rem 0;
    }
    .user-message {
        background-color: #e3f2fd;
        margin-left: 20%;
    }
    .assistant-message {
        background-color: #f5f5f5;
        margin-right: 20%;
    }
    .code-block {
        background-color: #282c34;
        color: #abb2bf;
        padding: 1rem;
        border-radius: 5px;
        font-family: 'Courier New', monospace;
    }
    div[data-testid="stSidebar"] {
        background-color: #f0f2f6;
    }
    .streamlit-expanderHeader {
        background-color: #e8eaf6;
        border-radius: 5px;
    }
    /* Animation for loading */
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
    .loading {
        animation: pulse 1.5s infinite;
    }
</style>
""", unsafe_allow_html=True)

class SQLQueryBuddyApp:
    def __init__(self):
        self.config = Config()
        self.initialize_session_state()
        self.setup_components()
        
    def initialize_session_state(self):
        if 'messages' not in st.session_state:
            st.session_state.messages = []
        if 'query_history' not in st.session_state:
            st.session_state.query_history = []
        if 'current_query' not in st.session_state:
            st.session_state.current_query = ""
        if 'metrics' not in st.session_state:
            st.session_state.metrics = {
                'queries_generated': 0,
                'successful_executions': 0,
                'optimizations_applied': 0,
                'average_response_time': 0
            }
        if 'database_connected' not in st.session_state:
            st.session_state.database_connected = False
        if 'show_tour' not in st.session_state:
            st.session_state.show_tour = True
            
    def setup_components(self):
        try:
            self.db_connector = DatabaseConnector(self.config.database_url)
            self.metadata_extractor = MetadataExtractor(self.db_connector)
            
            embedding_config = EmbeddingManager.EmbeddingConfig()
            self.embedding_manager = EmbeddingManager(embedding_config)
            
            vectorstore_config = ChromaVectorStore.VectorStoreConfig()
            self.vectorstore = ChromaVectorStore(vectorstore_config, self.embedding_manager)
            
            retriever_config = SemanticRetriever.RetrieverConfig()
            self.retriever = SemanticRetriever(
                self.vectorstore, 
                self.embedding_manager,
                retriever_config
            )
            
            self.orchestrator = Orchestrator(
                self.retriever,
                self.db_connector,
                self.config
            )
            
            st.session_state.database_connected = True
            
        except Exception as e:
            logger.error(f"Failed to initialize components: {e}")
            st.session_state.database_connected = False
    
    def render_sidebar(self):
        with st.sidebar:
            st.image("https://via.placeholder.com/300x100/4CAF50/FFFFFF?text=SQL+Query+Buddy", 
                    use_column_width=True)
            
            st.markdown("### 🏆 Contest Entry")
            st.info("Generative AI Developer Contest 2025")
            
            st.markdown("### ⚙️ Configuration")
            
            db_type = st.selectbox(
                "Database Type",
                ["SQLite", "PostgreSQL", "MySQL", "SQL Server"],
                index=0
            )
            
            if db_type != "SQLite":
                with st.expander("Database Connection"):
                    host = st.text_input("Host", "localhost")
                    port = st.number_input("Port", 5432)
                    database = st.text_input("Database", "")
                    username = st.text_input("Username", "")
                    password = st.text_input("Password", type="password")
                    
                    if st.button("Connect", type="primary"):
                        connection_string = f"{db_type.lower()}://{username}:{password}@{host}:{port}/{database}"
                        self.config.database_url = connection_string
                        self.setup_components()
            
            st.markdown("### 🎯 Features")
            
            col1, col2 = st.columns(2)
            with col1:
                show_optimization = st.checkbox("Query Optimization", value=True)
                show_explanation = st.checkbox("Explanations", value=True)
                show_visualization = st.checkbox("Visualizations", value=True)
            
            with col2:
                enable_cache = st.checkbox("Enable Cache", value=True)
                auto_correct = st.checkbox("Auto-Correction", value=True)
                stream_response = st.checkbox("Stream Response", value=True)
            
            st.markdown("### 📊 Session Metrics")
            
            metrics = st.session_state.metrics
            st.metric("Queries Generated", metrics['queries_generated'])
            st.metric("Success Rate", 
                     f"{(metrics['successful_executions'] / max(metrics['queries_generated'], 1) * 100):.1f}%")
            st.metric("Optimizations", metrics['optimizations_applied'])
            st.metric("Avg Response Time", f"{metrics['average_response_time']:.2f}s")
            
            st.markdown("### 📚 Resources")
            st.markdown("[📖 Documentation](https://github.com)")
            st.markdown("[🐛 Report Issue](https://github.com)")
            st.markdown("[⭐ Star on GitHub](https://github.com)")
            
            if st.button("🔄 Reset Session"):
                for key in st.session_state.keys():
                    del st.session_state[key]
                st.rerun()
    
    def render_header(self):
        col1, col2, col3 = st.columns([1, 2, 1])
        
        with col1:
            st.markdown("### 🤖 SQL Query Buddy")
            
        with col2:
            if st.session_state.database_connected:
                st.success("✅ Database Connected")
            else:
                st.error("❌ Database Disconnected")
                
        with col3:
            if st.button("🎓 Start Tour"):
                st.session_state.show_tour = True
                
        if st.session_state.show_tour:
            with st.info("Welcome to SQL Query Buddy! 🎉"):
                st.markdown("""
                **Quick Start Guide:**
                1. 💬 **Chat Tab**: Ask questions in natural language
                2. 🔍 **Query Builder**: Build queries step-by-step
                3. 📈 **Analytics**: View performance metrics
                4. 📚 **Documentation**: Learn advanced features
                
                Try asking: "Show me the top 5 customers by total sales"
                """)
                if st.button("Got it!", key="tour_dismiss"):
                    st.session_state.show_tour = False
                    st.rerun()
    
    def render_chat_interface(self):
        st.markdown("### 💬 Natural Language to SQL")
        
        # Display chat history
        chat_container = st.container()
        with chat_container:
            for message in st.session_state.messages:
                if message["role"] == "user":
                    st.markdown(f"""
                    <div class="chat-message user-message">
                        <strong>You:</strong> {message["content"]}
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown(f"""
                    <div class="chat-message assistant-message">
                        <strong>Assistant:</strong> {message["content"]}
                    </div>
                    """, unsafe_allow_html=True)
                    
                    if "sql" in message:
                        with st.expander("View Generated SQL"):
                            st.code(message["sql"], language="sql")
                    
                    if "results" in message:
                        with st.expander("View Results"):
                            st.dataframe(message["results"])
                    
                    if "optimization" in message:
                        with st.expander("View Optimization Suggestions"):
                            st.json(message["optimization"])
        
        # Input area
        col1, col2 = st.columns([5, 1])
        
        with col1:
            user_input = st.text_area(
                "Ask me anything about your data...",
                height=100,
                placeholder="e.g., Show me the top 5 customers by total sales",
                key="chat_input"
            )
        
        with col2:
            st.markdown("<br>", unsafe_allow_html=True)
            send_button = st.button("Send 📤", type="primary", use_container_width=True)
            
            example_button = st.button("Examples 💡", use_container_width=True)
            
        if example_button:
            with st.expander("Example Queries", expanded=True):
                examples = [
                    "Show me the top 5 customers by total sales",
                    "What's the average order value by month?",
                    "Find all products that haven't been ordered in the last 30 days",
                    "Which employees have the highest sales performance?",
                    "Compare revenue between this year and last year"
                ]
                
                for example in examples:
                    if st.button(example, key=f"ex_{example[:20]}"):
                        st.session_state.chat_input = example
                        st.rerun()
        
        if send_button and user_input:
            self.process_user_query(user_input)
    
    def process_user_query(self, user_input: str):
        st.session_state.messages.append({"role": "user", "content": user_input})
        
        with st.spinner("🤔 Thinking..."):
            try:
                start_time = datetime.now()
                
                # Generate SQL query
                result = asyncio.run(
                    self.orchestrator.process_query(user_input)
                )
                
                response_time = (datetime.now() - start_time).total_seconds()
                
                # Update metrics
                st.session_state.metrics['queries_generated'] += 1
                st.session_state.metrics['average_response_time'] = (
                    (st.session_state.metrics['average_response_time'] * 
                     (st.session_state.metrics['queries_generated'] - 1) + 
                     response_time) / st.session_state.metrics['queries_generated']
                )
                
                if result['success']:
                    st.session_state.metrics['successful_executions'] += 1
                    
                    message = {
                        "role": "assistant",
                        "content": result.get('explanation', 'Query generated successfully!'),
                        "sql": result.get('query', ''),
                        "results": result.get('results', pd.DataFrame())
                    }
                    
                    if result.get('optimization'):
                        message['optimization'] = result['optimization']
                        st.session_state.metrics['optimizations_applied'] += 1
                    
                    st.session_state.messages.append(message)
                    st.session_state.query_history.append({
                        'timestamp': datetime.now(),
                        'query': user_input,
                        'sql': result.get('query', ''),
                        'success': True
                    })
                    
                else:
                    error_message = {
                        "role": "assistant",
                        "content": f"❌ Error: {result.get('error', 'Unknown error occurred')}"
                    }
                    st.session_state.messages.append(error_message)
                    
            except Exception as e:
                logger.error(f"Query processing failed: {e}")
                st.error(f"An error occurred: {str(e)}")
        
        st.rerun()
    
    def render_query_builder(self):
        st.markdown("### 🔍 Visual Query Builder")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### Select Tables")
            
            tables = self.metadata_extractor.get_tables() if st.session_state.database_connected else []
            selected_tables = st.multiselect(
                "Choose tables",
                options=tables,
                key="builder_tables"
            )
            
            if selected_tables:
                st.markdown("#### Select Columns")
                
                all_columns = []
                for table in selected_tables:
                    columns = self.metadata_extractor.get_columns(table)
                    all_columns.extend([f"{table}.{col}" for col in columns])
                
                selected_columns = st.multiselect(
                    "Choose columns",
                    options=all_columns,
                    key="builder_columns"
                )
        
        with col2:
            st.markdown("#### Add Conditions")
            
            conditions = []
            num_conditions = st.number_input("Number of conditions", 0, 5, 0)
            
            for i in range(num_conditions):
                col1, col2, col3 = st.columns(3)
                
                with col1:
                    column = st.selectbox(
                        f"Column {i+1}",
                        options=all_columns if selected_tables else [],
                        key=f"cond_col_{i}"
                    )
                
                with col2:
                    operator = st.selectbox(
                        f"Operator {i+1}",
                        options=["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN"],
                        key=f"cond_op_{i}"
                    )
                
                with col3:
                    value = st.text_input(f"Value {i+1}", key=f"cond_val_{i}")
                
                if column and operator and value:
                    conditions.append(f"{column} {operator} '{value}'")
        
        st.markdown("#### Additional Options")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            group_by = st.multiselect(
                "GROUP BY",
                options=selected_columns if selected_columns else [],
                key="builder_group"
            )
        
        with col2:
            order_by = st.selectbox(
                "ORDER BY",
                options=[""] + (selected_columns if selected_columns else []),
                key="builder_order"
            )
            
            order_direction = st.radio(
                "Direction",
                options=["ASC", "DESC"],
                horizontal=True,
                key="builder_direction"
            )
        
        with col3:
            limit = st.number_input("LIMIT", min_value=0, value=0, key="builder_limit")
        
        if st.button("🔨 Build Query", type="primary"):
            query = self.build_query_from_selections(
                selected_tables,
                selected_columns,
                conditions,
                group_by,
                order_by,
                order_direction,
                limit
            )
            
            st.code(query, language="sql")
            
            if st.button("Execute Query"):
                self.execute_built_query(query)
    
    def build_query_from_selections(self, tables, columns, conditions, 
                                   group_by, order_by, order_direction, limit):
        
        if not tables or not columns:
            return "-- Please select tables and columns"
        
        query = f"SELECT {', '.join(columns)}\n"
        query += f"FROM {tables[0]}\n"
        
        for i in range(1, len(tables)):
            query += f"JOIN {tables[i]} ON {tables[0]}.id = {tables[i]}.id\n"
        
        if conditions:
            query += f"WHERE {' AND '.join(conditions)}\n"
        
        if group_by:
            query += f"GROUP BY {', '.join(group_by)}\n"
        
        if order_by:
            query += f"ORDER BY {order_by} {order_direction}\n"
        
        if limit > 0:
            query += f"LIMIT {limit}"
        
        return query
    
    def execute_built_query(self, query):
        try:
            executor = QueryExecutor(self.config.database_url, QueryExecutor.ExecutorConfig())
            result = executor.execute(query)
            
            if result['success']:
                st.success("Query executed successfully!")
                st.dataframe(result['data'])
            else:
                st.error(f"Execution failed: {result['error']}")
                
        except Exception as e:
            st.error(f"Error: {str(e)}")
    
    def render_analytics(self):
        st.markdown("### 📈 Analytics Dashboard")
        
        if not st.session_state.query_history:
            st.info("No queries executed yet. Start by asking questions in the Chat tab!")
            return
        
        # Query History Timeline
        st.markdown("#### Query History Timeline")
        
        df_history = pd.DataFrame(st.session_state.query_history)
        df_history['hour'] = pd.to_datetime(df_history['timestamp']).dt.hour
        
        fig_timeline = px.histogram(
            df_history,
            x='hour',
            title='Queries by Hour',
            labels={'hour': 'Hour of Day', 'count': 'Number of Queries'},
            color_discrete_sequence=['#4CAF50']
        )
        st.plotly_chart(fig_timeline, use_container_width=True)
        
        # Success Rate Gauge
        col1, col2, col3 = st.columns(3)
        
        with col1:
            success_rate = (st.session_state.metrics['successful_executions'] / 
                          max(st.session_state.metrics['queries_generated'], 1) * 100)
            
            fig_gauge = go.Figure(go.Indicator(
                mode="gauge+number",
                value=success_rate,
                title={'text': "Success Rate"},
                domain={'x': [0, 1], 'y': [0, 1]},
                gauge={
                    'axis': {'range': [None, 100]},
                    'bar': {'color': "#4CAF50"},
                    'steps': [
                        {'range': [0, 50], 'color': "#ffebee"},
                        {'range': [50, 80], 'color': "#fff3e0"},
                        {'range': [80, 100], 'color': "#e8f5e9"}
                    ],
                    'threshold': {
                        'line': {'color': "red", 'width': 4},
                        'thickness': 0.75,
                        'value': 90
                    }
                }
            ))
            fig_gauge.update_layout(height=300)
            st.plotly_chart(fig_gauge, use_container_width=True)
        
        with col2:
            avg_time = st.session_state.metrics['average_response_time']
            
            fig_time = go.Figure(go.Indicator(
                mode="number+delta",
                value=avg_time,
                title={'text': "Avg Response Time (s)"},
                delta={'reference': 3.0, 'increasing': {'color': "red"}, 'decreasing': {'color': "green"}},
                domain={'x': [0, 1], 'y': [0, 1]}
            ))
            fig_time.update_layout(height=300)
            st.plotly_chart(fig_time, use_container_width=True)
        
        with col3:
            optimization_rate = (st.session_state.metrics['optimizations_applied'] / 
                               max(st.session_state.metrics['queries_generated'], 1) * 100)
            
            fig_opt = go.Figure(go.Indicator(
                mode="gauge+number",
                value=optimization_rate,
                title={'text': "Optimization Rate"},
                domain={'x': [0, 1], 'y': [0, 1]},
                gauge={
                    'axis': {'range': [None, 100]},
                    'bar': {'color': "#764ba2"},
                    'bgcolor': "white",
                    'borderwidth': 2,
                    'bordercolor': "gray"
                }
            ))
            fig_opt.update_layout(height=300)
            st.plotly_chart(fig_opt, use_container_width=True)
        
        # Recent Queries Table
        st.markdown("#### Recent Queries")
        
        recent_queries = st.session_state.query_history[-10:][::-1]
        df_recent = pd.DataFrame(recent_queries)
        df_recent['timestamp'] = pd.to_datetime(df_recent['timestamp']).dt.strftime('%H:%M:%S')
        
        st.dataframe(
            df_recent[['timestamp', 'query', 'success']],
            use_container_width=True,
            hide_index=True
        )
    
    def render_documentation(self):
        st.markdown("### 📚 Documentation")
        
        tabs = st.tabs(["Getting Started", "Features", "API Reference", "Examples"])
        
        with tabs[0]:
            st.markdown("""
            #### Welcome to SQL Query Buddy!
            
            SQL Query Buddy is an AI-powered assistant that converts natural language to SQL queries.
            
            **Key Features:**
            - 🎯 Natural language to SQL conversion
            - 🔄 Self-correcting query generation
            - 📊 Query optimization suggestions
            - 📖 Beginner-friendly explanations
            - 🎨 Visual query builder
            
            **Quick Start:**
            1. Connect to your database (SQLite is pre-configured)
            2. Go to the Chat tab
            3. Type your question in natural language
            4. View the generated SQL and results
            
            **Supported Databases:**
            - SQLite
            - PostgreSQL
            - MySQL
            - SQL Server
            """)
        
        with tabs[1]:
            st.markdown("""
            #### Advanced Features
            
            **RAG (Retrieval Augmented Generation):**
            - Semantic search through database metadata
            - Context-aware query generation
            - Automatic schema detection
            
            **Query Optimization:**
            - Automatic index suggestions
            - JOIN order optimization
            - Subquery elimination
            - Performance estimation
            
            **Self-Correction:**
            - Automatic error detection
            - Query retry with fixes
            - Learning from failures
            
            **Multi-Agent System:**
            - Query Agent: Generates SQL from natural language
            - Optimization Agent: Improves query performance
            - Explanation Agent: Provides beginner-friendly explanations
            - Orchestrator: Coordinates all agents
            """)
        
        with tabs[2]:
            st.markdown("""
            #### API Reference
            
            **Query Generation:**
            ```python
            result = orchestrator.process_query(
                question="Show top 5 customers",
                optimize=True,
                explain=True
            )
            ```
            
            **Response Format:**
            ```json
            {
                "success": true,
                "query": "SELECT * FROM customers...",
                "results": [...],
                "optimization": {...},
                "explanation": "This query...",
                "execution_time": 0.234
            }
            ```
            
            **Available Commands:**
            - `/query`: Generate SQL query
            - `/optimize`: Optimize existing query
            - `/explain`: Explain query in simple terms
            - `/analyze`: Analyze query performance
            """)
        
        with tabs[3]:
            st.markdown("""
            #### Example Queries
            
            **Sales Analysis:**
            - "Show me total sales by month for the last year"
            - "Which products generate the most revenue?"
            - "Find customers who haven't ordered in 90 days"
            
            **Performance Queries:**
            - "Top 10 performing employees this quarter"
            - "Average order processing time by department"
            - "Conversion rate by marketing channel"
            
            **Complex Joins:**
            - "Show all orders with customer details and product information"
            - "Find products ordered together frequently"
            - "Calculate customer lifetime value with order history"
            
            **Aggregations:**
            - "Average, min, and max prices by category"
            - "Running total of sales by date"
            - "Year-over-year growth comparison"
            """)
    
    def run(self):
        self.render_sidebar()
        self.render_header()
        
        tabs = st.tabs(["💬 Chat", "🔍 Query Builder", "📈 Analytics", "📚 Documentation"])
        
        with tabs[0]:
            self.render_chat_interface()
        
        with tabs[1]:
            self.render_query_builder()
        
        with tabs[2]:
            self.render_analytics()
        
        with tabs[3]:
            self.render_documentation()

if __name__ == "__main__":
    app = SQLQueryBuddyApp()
    app.run()
```

AGENT_5_TESTING [branch: feature/testing-suite]:
Create comprehensive test suite...

AGENT_6_DEPLOYMENT [branch: feature/deployment]:
Configure deployment scripts...

Execute all agents in parallel, then merge:
```bash
git checkout develop
git merge feature/rag-implementation
git merge feature/sql-engine
git merge feature/ui-components
git merge feature/optimization-engine
git merge feature/testing-suite
git merge feature/deployment

git checkout main
git merge develop
git tag -a v1.0.0 -m "Contest submission version"
git push origin main --tags
```"
```

## Rapid Execution Commands

```bash
# SINGLE COMMAND TO BUILD ENTIRE PROJECT
claude "Execute complete SQL Query Buddy RAG build:
1. Create all directories and files from the orchestration guide
2. Implement all Python modules with production code
3. Set up Docker and deployment configuration
4. Create comprehensive test suite
5. Build Streamlit UI with all features
6. Configure GitHub Actions CI/CD
7. Generate sample data and documentation
8. Deploy to Hugging Face Spaces
9. Create LinkedIn post content
10. Generate demo video script

Use parallel processing where possible. Include error handling, logging, and performance optimization throughout. Make it contest-winning quality."

# ALTERNATIVE: Step-by-step with verification
claude "Step 1: Create project structure" && \
claude "Step 2: Implement RAG system with code from guide" && \
claude "Step 3: Build SQL engine with optimization" && \
claude "Step 4: Create Streamlit UI" && \
claude "Step 5: Add tests and deploy"

# QUICK FIX COMMAND
claude "Debug and fix the current error in [filename]. Use the implementation from the orchestration guide."

# OPTIMIZATION COMMAND
claude "Optimize the entire codebase for the contest deadline. Focus on:
- Performance improvements
- UI polish
- Error handling
- Documentation
- Demo scenarios"
```

## Git Workflow Automation

```bash
# Initialize and configure git with branches
claude "Run these git commands:
git init
git config --global user.name 'Your Name'
git config --global user.email 'your.email@example.com'

# Create branch structure
git checkout -b main
echo '# SQL Query Buddy RAG' > README.md
git add . && git commit -m 'Initial commit'

git checkout -b develop
git checkout -b feature/rag-core
git checkout -b feature/sql-engine
git checkout -b feature/ui
git checkout -b feature/agents
git checkout -b feature/optimization

# Set up git flow
git flow init -d

# Create GitHub repository
gh repo create sql-query-buddy --public --description 'AI Contest Entry'
git remote add origin https://github.com/yourusername/sql-query-buddy.git
git push -u origin main
git push --all origin"

# Automated commit messages
claude "Create git commit with conventional commit format for current changes:
- Analyze changes
- Generate appropriate commit type (feat/fix/docs/style/refactor/test/chore)
- Write descriptive commit message
- Include issue references if applicable"
```

## Contest Submission Checklist

```bash
claude "Run complete contest submission checklist:
□ All features implemented and working
□ Documentation complete (README, API docs, examples)
□ Tests passing with >80% coverage
□ Deployed to Hugging Face Spaces
□ Demo video recorded (2 minutes)
□ LinkedIn post drafted with hashtags
□ GitHub repository public with good README
□ Performance metrics collected and documented
□ Unique features highlighted
□ Code quality checks passed (linting, formatting)
□ Security vulnerabilities checked
□ Database with sample data included
□ Error handling comprehensive
□ UI/UX polished and responsive
□ Contest requirements verified

Generate report with status of each item."
```

## Performance Monitoring

```bash
# Add performance tracking
claude "Implement performance monitoring:
- Query execution time tracking
- Memory usage monitoring  
- Cache hit rates
- Error rates and types
- User interaction metrics
- Generate performance dashboard in Streamlit"
```

## Emergency Commands

```bash
# If running out of time
claude "EMERGENCY MODE: Create minimal viable submission:
1. Core RAG functionality only
2. Basic Streamlit UI
3. Essential documentation
4. Quick deployment
Focus on working demo over completeness"

# Quick recovery from errors
claude "Revert to last working state and fix:
git stash
git checkout develop
git pull
Fix the specific issue in [file]
Test and verify
git add . && git commit -m 'fix: resolved [issue]'
git push"
```

Remember: Use multiple terminal windows/tabs to run agents in parallel for maximum speed!