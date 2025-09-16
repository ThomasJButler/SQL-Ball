#!/usr/bin/env node

/**
 * Test script for SQL-Ball RAG backend
 * Tests various natural language queries
 */

const TEST_QUERIES = [
  "Show me the top 5 scorers",
  "Which teams have the best home record?",
  "Find all strikers with more than 10 goals",
  "List goalkeepers with clean sheets",
  "Show Arsenal's matches this season",
  "Players from Manchester clubs",
  "Matches with highest xG"
];

async function testBackend() {
  const baseUrl = 'http://localhost:8000';

  console.log('🧪 Testing SQL-Ball RAG Backend\n');
  console.log('=' .repeat(50));

  // Test health check
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const health = await healthResponse.json();
    console.log('✅ Backend health:', health.status);
    console.log('   Version:', health.version);
  } catch (error) {
    console.error('❌ Backend not running! Start with: cd backend && uvicorn main:app --reload');
    process.exit(1);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('Testing Natural Language Queries:\n');

  // Test each query
  for (const query of TEST_QUERIES) {
    console.log(`\n📝 Query: "${query}"`);
    console.log('-' .repeat(40));

    try {
      const response = await fetch(`${baseUrl}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: query,
          season: '2024-2025',
          include_explanation: false,
          limit: 5
        })
      });

      const result = await response.json();

      if (result.sql) {
        // Check SQL syntax
        const sql = result.sql.toUpperCase();
        const hasWrongOrder = sql.indexOf('GROUP BY') > -1 &&
                             sql.indexOf('WHERE') > -1 &&
                             sql.indexOf('WHERE') > sql.indexOf('GROUP BY');

        if (hasWrongOrder) {
          console.log('⚠️  SQL has WHERE after GROUP BY (will be auto-fixed)');
        }

        console.log('✅ Generated SQL:');
        console.log('   ' + result.sql.substring(0, 100) + (result.sql.length > 100 ? '...' : ''));
        console.log(`⏱️  Time: ${result.execution_time_ms}ms`);

        if (result.mappings_used && Object.keys(result.mappings_used).length > 0) {
          console.log('🗺️  Mappings used:', Object.keys(result.mappings_used).join(', '));
        }
      } else {
        console.log('❌ No SQL generated');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Testing complete!\n');
}

// Run tests
testBackend().catch(console.error);