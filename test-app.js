#!/usr/bin/env node

/**
 * SQL-Ball Quick Test Script
 * Run with: node test-app.js
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.blue}${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}${colors.reset}`)
};

// Check environment variables
function checkEnvironment() {
  log.header('ENVIRONMENT CHECK');

  const required = [
    'PUBLIC_SUPABASE_URL',
    'PUBLIC_SUPABASE_ANON_KEY'
  ];

  const optional = [
    'VITE_OPENAI_API_KEY',
    'VITE_FOOTBALL_DATA_API_KEY'
  ];

  let allGood = true;

  // Check required vars
  for (const key of required) {
    if (process.env[key]) {
      log.success(`${key} is set`);
    } else {
      log.error(`${key} is missing (REQUIRED)`);
      allGood = false;
    }
  }

  // Check optional vars
  for (const key of optional) {
    if (process.env[key]) {
      log.success(`${key} is set`);
    } else {
      log.warning(`${key} is not set (optional)`);
    }
  }

  return allGood;
}

// Check if dev server is running
async function checkDevServer() {
  log.header('DEV SERVER CHECK');

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('http://localhost:3000');

    if (response.ok) {
      log.success('Dev server is running on port 3000');
      return true;
    } else {
      log.error(`Dev server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error('Dev server is not running');
    log.info('Start it with: npm run dev');
    return false;
  }
}

// Check build
function checkBuild() {
  log.header('BUILD CHECK');

  const { execSync } = require('child_process');

  try {
    log.info('Running build test...');
    execSync('npm run build', { stdio: 'pipe' });
    log.success('Build completed successfully');
    return true;
  } catch (error) {
    log.error('Build failed');
    log.info('Check the error output above');
    return false;
  }
}

// Check test suite
function checkTests() {
  log.header('TEST SUITE CHECK');

  const { execSync } = require('child_process');

  try {
    const output = execSync('npm run test:run 2>&1', { encoding: 'utf8' });
    const lines = output.split('\n');

    // Parse test results
    const summaryLine = lines.find(l => l.includes('Tests') && l.includes('passed'));

    if (summaryLine) {
      const match = summaryLine.match(/(\d+) passed/);
      const passed = match ? match[1] : '0';
      const failMatch = summaryLine.match(/(\d+) failed/);
      const failed = failMatch ? failMatch[1] : '0';

      if (failed === '0') {
        log.success(`All tests passed (${passed} tests)`);
      } else {
        log.warning(`${passed} tests passed, ${failed} tests failed`);
      }
    } else {
      log.info('Tests completed (check output for details)');
    }

    return true;
  } catch (error) {
    log.error('Test suite failed to run');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`
╔══════════════════════════════════════════════════╗
║         SQL-Ball Application Test Suite          ║
╚══════════════════════════════════════════════════╝
`);

  const results = {
    environment: checkEnvironment(),
    devServer: await checkDevServer(),
    build: false, // Skip build test by default (takes time)
    tests: false  // Skip test suite by default
  };

  // Ask if user wants to run longer tests
  log.header('OPTIONAL TESTS');
  log.info('Skipping build and test suite checks (they take time)');
  log.info('Run them manually with:');
  log.info('  npm run build');
  log.info('  npm run test');

  // Summary
  log.header('TEST SUMMARY');

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r === true).length;

  if (passed === total) {
    log.success(`All ${total} checks passed! 🎉`);
  } else {
    log.warning(`${passed}/${total} checks passed`);
  }

  // Recommendations
  log.header('NEXT STEPS');

  if (!results.environment) {
    log.info('1. Add missing environment variables to .env file');
  }

  if (!results.devServer) {
    log.info('1. Start the dev server: npm run dev');
  }

  if (results.devServer) {
    log.info('1. Open http://localhost:3000 in your browser');
    log.info('2. Test the Query Builder with natural language');
    log.info('3. Check Pattern Discovery for anomalies');
    log.info('4. Try the Visual Query Builder');
  }

  log.info('\nFor detailed testing, see docs/TESTING_GUIDE.md');
}

// Run the tests
runTests().catch(error => {
  log.error(`Test runner failed: ${error.message}`);
  process.exit(1);
});