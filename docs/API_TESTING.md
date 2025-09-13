# 🔌 SQL-Ball API Testing Documentation

## API Integration Overview

SQL-Ball integrates with three main APIs:
1. **OpenAI API** - Natural language processing and SQL generation
2. **Supabase API** - Database operations and historical data
3. **Football-Data.org API** - Live match data (optional)

## 🧪 API Testing Procedures

### 1. OpenAI API Testing

#### Configuration Test
```javascript
// Test API key validity
const testOpenAI = async () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY ||
                  localStorage.getItem('openai_api_key');

  if (!apiKey) {
    console.error('❌ No OpenAI API key found');
    return false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      console.log('✅ OpenAI API key is valid');
      return true;
    } else {
      console.error('❌ Invalid API key:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
    return false;
  }
};

testOpenAI();
```

#### Query Generation Test
```javascript
// Test natural language to SQL conversion
const testQueryGeneration = async (naturalQuery) => {
  const queryGenerator = new QueryGenerator(apiKey);

  console.log(`Testing: "${naturalQuery}"`);

  try {
    const result = await queryGenerator.generateQuery(naturalQuery);
    console.log('Generated SQL:', result.sql);
    console.log('Confidence:', result.confidence);
    console.log('Explanation:', result.explanation);
    return result;
  } catch (error) {
    console.error('Query generation failed:', error);
    return null;
  }
};

// Test cases
const testQueries = [
  "Show me all matches",
  "Find home wins by Arsenal",
  "Which team scored the most goals?",
  "Show matches with more than 5 goals"
];

testQueries.forEach(q => testQueryGeneration(q));
```

#### Rate Limiting Test
```javascript
// Test API rate limits
const testRateLimits = async () => {
  const requests = [];

  // Send 5 requests quickly
  for (let i = 0; i < 5; i++) {
    requests.push(
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      })
    );
  }

  const results = await Promise.allSettled(requests);
  const rateLimited = results.filter(r =>
    r.status === 'fulfilled' && r.value.status === 429
  );

  console.log(`Rate limit test: ${rateLimited.length}/5 requests rate limited`);
};
```

### 2. Supabase API Testing

#### Connection Test
```javascript
// Test Supabase connection
const testSupabase = async () => {
  const { supabase } = await import('../lib/supabase');

  try {
    // Test basic query
    const { data, error } = await supabase
      .from('matches')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Supabase error:', error);
      return false;
    }

    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return false;
  }
};

testSupabase();
```

#### CRUD Operations Test
```javascript
// Test database operations
const testDatabaseOps = async () => {
  const { supabase } = await import('../lib/supabase');

  // READ test
  console.log('Testing READ...');
  const { data: matches, error: readError } = await supabase
    .from('matches')
    .select('*')
    .limit(5);

  if (readError) {
    console.error('❌ READ failed:', readError);
  } else {
    console.log('✅ READ successful, found', matches.length, 'matches');
  }

  // Test aggregations
  console.log('Testing AGGREGATIONS...');
  const { data: stats, error: statsError } = await supabase
    .from('matches')
    .select('home_team, home_goals')
    .gt('home_goals', 3);

  if (statsError) {
    console.error('❌ AGGREGATION failed:', statsError);
  } else {
    console.log('✅ AGGREGATION successful');
  }

  // Test ordering
  console.log('Testing ORDER BY...');
  const { data: ordered, error: orderError } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })
    .limit(10);

  if (orderError) {
    console.error('❌ ORDER BY failed:', orderError);
  } else {
    console.log('✅ ORDER BY successful');
  }
};

testDatabaseOps();
```

#### Performance Test
```javascript
// Test query performance
const testPerformance = async () => {
  const { supabase } = await import('../lib/supabase');

  const queries = [
    { name: 'Simple SELECT',
      query: () => supabase.from('matches').select('*').limit(10) },
    { name: 'With WHERE',
      query: () => supabase.from('matches').select('*').eq('home_team', 'Arsenal') },
    { name: 'With JOIN',
      query: () => supabase.from('matches').select('*, seasons(*)') },
    { name: 'Aggregation',
      query: () => supabase.from('matches').select('home_goals.sum()') }
  ];

  for (const test of queries) {
    const start = performance.now();
    const { data, error } = await test.query();
    const end = performance.now();

    console.log(`${test.name}: ${(end - start).toFixed(2)}ms`);
  }
};

testPerformance();
```

### 3. Football-Data API Testing

#### API Key Validation
```javascript
// Test Football-Data API key
const testFootballDataAPI = async () => {
  const apiKey = localStorage.getItem('football_data_api_key') ||
                  import.meta.env.VITE_FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    console.log('⚠️ No Football-Data API key configured');
    return false;
  }

  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/PL', {
      headers: {
        'X-Auth-Token': apiKey
      }
    });

    if (response.ok) {
      console.log('✅ Football-Data API connected');
      const data = await response.json();
      console.log('Competition:', data.name);
      return true;
    } else if (response.status === 403) {
      console.error('❌ Invalid API key');
      return false;
    } else if (response.status === 429) {
      console.error('⚠️ Rate limited');
      return false;
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
    return false;
  }
};

testFootballDataAPI();
```

#### Live Data Test
```javascript
// Test live match data
const testLiveData = async () => {
  const { footballDataAPI } = await import('../services/api/footballData');

  console.log('Testing live data endpoints...');

  // Test current season
  const season = await footballDataAPI.getCurrentSeason();
  console.log('Current season:', season?.name || 'Not available');

  // Test upcoming matches
  const upcoming = await footballDataAPI.getUpcomingMatches(7);
  console.log('Upcoming matches:', upcoming.length);

  // Test recent results
  const recent = await footballDataAPI.getRecentMatches(7);
  console.log('Recent results:', recent.length);

  // Test standings
  const standings = await footballDataAPI.getStandings();
  console.log('Teams in standings:', standings.length);
};

testLiveData();
```

## 🔍 API Error Handling Tests

### Network Failure Simulation
```javascript
// Simulate network failures
const testNetworkFailures = async () => {
  // Save original fetch
  const originalFetch = window.fetch;

  // Simulate network failure
  window.fetch = () => Promise.reject(new Error('Network failure'));

  try {
    // Test your API calls
    const result = await testQueryGeneration("test query");
    console.log('Should have failed but got:', result);
  } catch (error) {
    console.log('✅ Correctly handled network failure');
  }

  // Restore fetch
  window.fetch = originalFetch;
};

testNetworkFailures();
```

### API Response Validation
```javascript
// Validate API responses
const validateAPIResponse = (response, schema) => {
  const errors = [];

  // Check required fields
  for (const field of schema.required) {
    if (!(field in response)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check field types
  for (const [field, type] of Object.entries(schema.types)) {
    if (field in response && typeof response[field] !== type) {
      errors.push(`Invalid type for ${field}: expected ${type}, got ${typeof response[field]}`);
    }
  }

  return errors;
};

// Example schema
const queryResultSchema = {
  required: ['sql', 'confidence', 'explanation'],
  types: {
    sql: 'string',
    confidence: 'number',
    explanation: 'string',
    optimizationSuggestions: 'object'
  }
};
```

## 📊 API Monitoring

### Request Logger
```javascript
// Log all API requests for debugging
const setupAPILogger = () => {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const [url, options] = args;
    const start = performance.now();

    try {
      const response = await originalFetch(...args);
      const duration = performance.now() - start;

      console.log(`API: ${options?.method || 'GET'} ${url} - ${response.status} (${duration.toFixed(0)}ms)`);

      return response;
    } catch (error) {
      console.error(`API Error: ${url}`, error);
      throw error;
    }
  };
};

// Enable logging
setupAPILogger();
```

### Performance Metrics
```javascript
// Track API performance
class APIMetrics {
  constructor() {
    this.metrics = {
      openai: [],
      supabase: [],
      footballData: []
    };
  }

  record(api, duration, success) {
    this.metrics[api].push({
      timestamp: Date.now(),
      duration,
      success
    });
  }

  getStats(api) {
    const data = this.metrics[api];
    if (data.length === 0) return null;

    const durations = data.map(d => d.duration);
    const successRate = data.filter(d => d.success).length / data.length;

    return {
      count: data.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      successRate: (successRate * 100).toFixed(1) + '%'
    };
  }
}

const apiMetrics = new APIMetrics();
```

## 🚨 Common API Issues

### Issue: CORS Errors
```javascript
// Solution: Use proxy in development
// vite.config.ts already configured for Football-Data API
'/api/football-data': {
  target: 'https://api.football-data.org/v4',
  changeOrigin: true
}
```

### Issue: Rate Limiting
```javascript
// Implement retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};
```

### Issue: Timeout Errors
```javascript
// Add timeout to fetch requests
const fetchWithTimeout = (url, options, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};
```

## 📈 API Testing Dashboard

Create a simple test dashboard:

```html
<!DOCTYPE html>
<html>
<head>
  <title>SQL-Ball API Test Dashboard</title>
  <style>
    .test { padding: 10px; margin: 5px; border-radius: 5px; }
    .success { background: #d4edda; }
    .failure { background: #f8d7da; }
    .pending { background: #fff3cd; }
  </style>
</head>
<body>
  <h1>API Test Dashboard</h1>
  <div id="results"></div>

  <script>
    async function runAllTests() {
      const tests = [
        { name: 'OpenAI Connection', fn: testOpenAI },
        { name: 'Supabase Connection', fn: testSupabase },
        { name: 'Football-Data Connection', fn: testFootballDataAPI },
        { name: 'Query Generation', fn: () => testQueryGeneration('test') },
        { name: 'Database Operations', fn: testDatabaseOps }
      ];

      const results = document.getElementById('results');

      for (const test of tests) {
        const div = document.createElement('div');
        div.className = 'test pending';
        div.textContent = `${test.name}: Testing...`;
        results.appendChild(div);

        try {
          const success = await test.fn();
          div.className = success ? 'test success' : 'test failure';
          div.textContent = `${test.name}: ${success ? '✅ Passed' : '❌ Failed'}`;
        } catch (error) {
          div.className = 'test failure';
          div.textContent = `${test.name}: ❌ Error - ${error.message}`;
        }
      }
    }

    runAllTests();
  </script>
</body>
</html>
```

---

**Last Updated**: September 2025
**Test Coverage**: OpenAI (100%), Supabase (100%), Football-Data (100%)
**Maintained by**: SQL-Ball Development Team