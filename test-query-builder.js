#!/usr/bin/env node

/**
 * Test script for Query Builder functionality
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testQueryBuilder() {
  console.log('🧪 Testing Query Builder...\n');

  try {
    // Check if server is running
    const response = await fetch('http://localhost:5173/');
    if (!response.ok) {
      console.error('❌ Server not responding');
      return;
    }
    console.log('✅ Server is running');

    // Test if the page loads without errors
    const html = await response.text();
    if (html.includes('SQL-Ball')) {
      console.log('✅ Application loaded successfully');
    }

    // Check for API keys in the environment
    const hasOpenAI = process.env.VITE_OPENAI_API_KEY ? '✅' : '❌';
    const hasFootballData = process.env.VITE_FOOTBALL_DATA_API_KEY ? '✅' : '❌';

    console.log(`\n📊 API Key Status:`);
    console.log(`${hasOpenAI} OpenAI API Key`);
    console.log(`${hasFootballData} Football Data API Key`);

    console.log('\n📝 Next Steps:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Navigate to the Query Builder section');
    console.log('3. Try a query like: "Show me the last 10 matches"');
    console.log('4. Check the browser console for any errors');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testQueryBuilder();