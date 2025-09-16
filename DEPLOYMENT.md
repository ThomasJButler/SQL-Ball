# 🚀 SQL-Ball Deployment Guide

Complete guide to deploy SQL-Ball with Vercel (frontend) + Render (backend).

## 📋 Prerequisites

- GitHub repository with your code
- Render account (free tier available)
- Vercel account (free tier available)
- OpenAI API key

## 🔧 Backend Deployment (Render)

### 1. Prepare Your Repository

Ensure these files are in your repo:
- ✅ `render.yaml` (created)
- ✅ `backend/requirements.txt` (updated)
- ✅ `backend/main.py` (CORS updated)
- ✅ `backend/rag/embeddings.py` (persistent storage configured)

### 2. Deploy to Render

1. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account
   - Click "New+" → "Blueprint"
   - Select your `SQL-Ball` repository

2. **Environment Variables:**
   Set these in Render dashboard:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PYTHON_VERSION=3.11.0
   ENVIRONMENT=production
   CHROMA_PERSIST_DIRECTORY=/opt/render/project/backend/chroma_db
   CHROMA_COLLECTION_NAME=sql_ball_schema
   ```

3. **Deploy:**
   - Render will automatically use `render.yaml`
   - Build typically takes 5-10 minutes
   - Your backend will be at: `https://sql-ball-backend.onrender.com`

### 3. Verify Backend

Test your backend:
```bash
curl https://sql-ball-backend.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "SQL-Ball API",
  "rag_initialized": true
}
```

## 🌐 Frontend Deployment (Vercel)

### 1. Update Backend URL

Your `vercel.json` is already configured with:
```json
"build": {
  "env": {
    "VITE_API_BASE_URL": "https://sql-ball-backend.onrender.com"
  }
}
```

**Update this URL** to match your actual Render backend URL.

### 2. Deploy to Vercel

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select "SQL-Ball" project

2. **Environment Variables:**
   Add in Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://your-actual-backend-url.onrender.com
   NODE_ENV=production
   ```

3. **Deploy:**
   - Vercel will automatically detect Vite/Svelte
   - Build typically takes 2-5 minutes
   - Your app will be at: `https://your-project.vercel.app`

## 🔄 Update CORS (Important!)

After getting your Vercel URL, update the backend CORS settings:

1. **Edit `backend/main.py`:**
   ```python
   allow_origins=[
       "http://localhost:5173", 
       "http://localhost:5174", 
       "http://localhost:4173",
       "https://*.vercel.app",
       "https://your-actual-app.vercel.app",  # Add your actual Vercel URL
   ],
   ```

2. **Redeploy backend** on Render (auto-deploy from git push)

## ✅ Testing Deployment

### Backend Tests
```bash
# Health check
curl https://your-backend.onrender.com/health

# Test API endpoint
curl -X POST https://your-backend.onrender.com/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Show me Liverpool matches", "api_key": "your_key"}'
```

### Frontend Tests
1. Visit your Vercel URL
2. Check browser console for errors
3. Try generating a SQL query
4. Verify API calls work in Network tab

## 🚨 Common Issues

### Backend Issues

**ChromaDB Initialization Fails:**
- Render's disk storage needs time to initialize
- Check logs: Render Dashboard → Service → Logs
- Wait 5-10 minutes after first deploy

**CORS Errors:**
```
Access to fetch blocked by CORS policy
```
- Update `allow_origins` in `backend/main.py`
- Include your actual Vercel domain
- Redeploy backend

**RAG Not Initialized:**
```json
{"rag_initialized": false}
```
- Check OpenAI API key is set
- View logs for ChromaDB errors
- Restart service if needed

### Frontend Issues

**API Connection Fails:**
- Check `VITE_API_BASE_URL` environment variable
- Ensure backend is fully deployed
- Check Network tab for 500/404 errors

**Build Fails:**
- Node version mismatch
- Missing dependencies in package.json
- Check Vercel build logs

## 🔧 Environment Variables Summary

### Render (Backend)
```
OPENAI_API_KEY=sk-...
PYTHON_VERSION=3.11.0
ENVIRONMENT=production
CHROMA_PERSIST_DIRECTORY=/opt/render/project/backend/chroma_db
CHROMA_COLLECTION_NAME=sql_ball_schema
```

### Vercel (Frontend)
```
VITE_API_BASE_URL=https://your-backend.onrender.com
NODE_ENV=production
```

## 📊 Monitoring

### Backend Monitoring
- Render Dashboard → Metrics
- Check for memory usage spikes
- Monitor response times

### Frontend Monitoring
- Vercel Analytics (if enabled)
- Browser Developer Tools
- User feedback

## 🔄 Updates

### Backend Updates
1. Push to GitHub
2. Render auto-deploys from main branch
3. Monitor logs during deployment

### Frontend Updates
1. Push to GitHub  
2. Vercel auto-deploys
3. Check Vercel dashboard for build status

## 💡 Performance Tips

### Backend Optimization
- Use Render's Starter plan for production
- Enable persistent storage for ChromaDB
- Monitor memory usage

### Frontend Optimization
- Enable Vercel Analytics
- Use environment variables for API URLs
- Implement proper error handling

## 🎯 Next Steps

1. **Custom Domain:** Configure custom domain in Vercel
2. **Database:** Set up proper database (PostgreSQL) for production
3. **Monitoring:** Add error tracking (Sentry)
4. **Caching:** Implement query result caching
5. **Security:** Add rate limiting and authentication

## 🆘 Support

If you encounter issues:

1. **Check logs:**
   - Render: Service → Logs
   - Vercel: Project → Functions/Deployments

2. **Common fixes:**
   - Restart services
   - Clear cache and redeploy
   - Verify environment variables

3. **Debugging:**
   - Enable debug mode
   - Check browser console
   - Test API endpoints directly

---

**Success Indicators:**
- ✅ Backend health check returns `{"status": "healthy", "rag_initialized": true}`
- ✅ Frontend loads without console errors
- ✅ Can generate SQL queries
- ✅ No CORS errors
- ✅ API calls complete successfully

Your app should now be live and functional! 🎉
