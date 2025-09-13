# 🧪 SQL-Ball Complete Testing Guide

## 📋 Quick Start Testing Checklist

### Prerequisites
```bash
# 1. Check your environment
node --version  # Should be v16+
npm --version   # Should be v8+

# 2. Install dependencies
npm install

# 3. Set up API keys in .env
VITE_OPENAI_API_KEY=your-openai-key
VITE_FOOTBALL_DATA_API_KEY=your-football-data-key
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# 4. Start development server
npm run dev
```

## 🎯 Manual Testing Guide

### 1. First-Time User Experience

#### OpenAI Setup Wizard
1. **Clear localStorage**: Open DevTools → Application → Clear Storage
2. **Refresh page**: Should see OpenAI setup wizard
3. **Test scenarios**:
   - ✅ Enter valid API key → Should validate and save
   - ❌ Enter invalid key → Should show error
   - ⏭️ Skip setup → Should allow but disable AI features

#### Initial Dashboard Load
1. Navigate to http://localhost:3000
2. Verify:
   - [ ] Live ticker shows upcoming matches
   - [ ] Dashboard stats load properly
   - [ ] Recent matches display
   - [ ] Charts render without errors

### 2. Core Feature Testing

#### 🔍 Query Builder (Natural Language → SQL)
Test these queries in order of complexity:

**Basic Queries:**
```
"Show me all matches"
"List the last 5 matches"
"Show matches from December"
```

**Intermediate Queries:**
```
"Which team scored the most goals this season?"
"Find all matches where the home team won"
"Show me matches with more than 5 total goals"
```

**Advanced Queries:**
```
"Find the biggest upset victories"
"Show teams with best away record"
"Which matches had the most yellow cards?"
```

**Expected for each query:**
- Generated SQL displayed
- Confidence score shown (0-100%)
- Explanation provided
- Results table populated
- Response time < 2 seconds

#### 🎨 Visual Query Builder
1. Navigate to SQL Explorer
2. Test drag-and-drop:
   - [ ] Drag 'matches' table to canvas
   - [ ] Select columns (home_team, away_team, home_goals)
   - [ ] Add WHERE condition (home_goals > 2)
   - [ ] Add ORDER BY (date DESC)
   - [ ] Click "Execute Query"
3. Verify SQL generation and results

#### 🔮 Pattern Discovery
1. Navigate to Pattern Discovery
2. Click "Discover Patterns"
3. Verify detection of:
   - [ ] High-scoring matches
   - [ ] Unusual results
   - [ ] Team performance streaks
   - [ ] Referee statistics
4. Test export:
   - [ ] Export as JSON
   - [ ] Verify file downloads

#### 📊 Enhanced Visualizations
1. Check Dashboard visualizations
2. Test date range selector:
   - [ ] Select "2024-2025 Season"
   - [ ] Select "2025-2026 Season"
   - [ ] Select "Last 30 days"
3. Verify charts update with new data

### 3. API Integration Testing

#### Supabase Connection
```javascript
// Run in browser console
const testSupabase = async () => {
  const response = await fetch('/api/test-db');
  console.log('Database status:', response.ok ? '✅ Connected' : '❌ Failed');
};
testSupabase();
```

#### OpenAI Integration
```javascript
// Test in Query Builder
const testQuery = "Show me all matches";
// Should generate SQL without errors
```

#### Football-Data API (if configured)
```javascript
// Check in browser console
const hasApiKey = !!localStorage.getItem('football_data_api_key');
console.log('Football-Data API:', hasApiKey ? '✅ Configured' : '⚠️ Not configured');
```

### 4. Error Handling Tests

#### Invalid Query Handling
1. Enter nonsense query: "asdfghjkl"
2. Should show: "Could not understand query" error

#### API Failure Scenarios
1. Temporarily rename API key in .env
2. Test features → Should show fallback messages
3. Restore API key

#### Network Failure
1. Open DevTools → Network → Offline mode
2. Try queries → Should show connection error
3. Go back online → Should recover

### 5. Performance Testing

#### Response Times
- Query generation: < 2 seconds
- Pattern discovery: < 5 seconds
- Dashboard load: < 3 seconds
- Chart rendering: < 1 second

#### Memory Usage
1. Open DevTools → Performance
2. Record while using features
3. Check for memory leaks

### 6. Cross-Browser Testing

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

### 7. Accessibility Testing

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals

#### Screen Reader
- [ ] All buttons have labels
- [ ] Images have alt text
- [ ] Form inputs have labels

## 🤖 Automated Testing

### Run Test Suites
```bash
# Unit tests
npm run test

# Specific test file
npm run test -- dataService.test.ts

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Categories

#### Unit Tests
- `/src/lib/rag/queryGenerator.test.ts` - RAG system
- `/src/lib/analytics/patternDiscovery.test.ts` - Pattern detection
- `/src/services/dataService.test.ts` - Data layer

#### Integration Tests
- API endpoints
- Database queries
- Third-party services

#### E2E Tests (if implemented)
```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test
```

## 🐛 Debugging Guide

### Common Issues & Solutions

#### "OpenAI API key not found"
```bash
# Check .env file
cat .env | grep OPENAI

# Verify in browser
localStorage.getItem('openai_api_key')
```

#### "Database connection failed"
```bash
# Test Supabase URL
curl YOUR_SUPABASE_URL/rest/v1/

# Check credentials
echo $PUBLIC_SUPABASE_URL
echo $PUBLIC_SUPABASE_ANON_KEY
```

#### "Build fails"
```bash
# Clear cache and rebuild
rm -rf node_modules
npm install
npm run build
```

### Browser DevTools

#### Console Debugging
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Check API responses
window.__APP_STATE__ = { debug: true };
```

#### Network Tab
- Filter by XHR/Fetch
- Check request/response headers
- Monitor API call timing

## 📊 Test Coverage Report

### Current Coverage Status
- **Unit Tests**: 18/42 passing (43%)
- **Integration**: Not implemented
- **E2E**: Not implemented

### Priority Areas for Testing
1. RAG system (QueryGenerator)
2. Pattern discovery algorithms
3. Visual Query Builder
4. API error handling
5. Authentication flow

## 🚀 Performance Benchmarks

### Target Metrics
| Feature | Target | Current |
|---------|--------|---------|
| Query Generation | < 2s | ✅ 1.5s |
| Pattern Discovery | < 5s | ✅ 3s |
| Dashboard Load | < 3s | ✅ 2s |
| Build Size | < 2MB | ✅ 1.3MB |

## 📝 Test Documentation

### Writing New Tests
```javascript
// Example test structure
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', async () => {
    // Arrange
    const input = 'test data';

    // Act
    const result = await functionToTest(input);

    // Assert
    expect(result).toBeDefined();
    expect(result.property).toBe('expected');
  });
});
```

## 🎓 Learning Resources

Based on your LangChain training, you can enhance testing with:

1. **Memory Testing**: Test conversation persistence
2. **Prompt Template Testing**: Validate different prompts
3. **Chain Testing**: Test query chains
4. **Agent Testing**: Multi-agent interactions

## 📅 Testing Schedule

### Daily Testing
- [ ] Smoke test (basic functionality)
- [ ] Query Builder works
- [ ] Dashboard loads

### Weekly Testing
- [ ] Full feature regression
- [ ] Performance benchmarks
- [ ] Cross-browser checks

### Pre-Release Testing
- [ ] Complete test suite
- [ ] Security audit
- [ ] Performance profiling
- [ ] Accessibility audit

---

**Last Updated**: September 2025
**Maintained by**: SQL-Ball Team
**Contact**: Check Settings → Help for support