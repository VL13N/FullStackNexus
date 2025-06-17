/**
 * TAAPI Health Check Smoke Test
 * Verifies TAAPI Pro authentication and endpoint functionality
 */

import fetch from 'node-fetch';

async function runTaapiHealthCheck() {
  try {
    console.log('Running TAAPI Pro health check...');
    
    const response = await fetch('http://localhost:5000/api/taapi/test');
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('OK');
      console.log(`TAAPI Auth: SUCCESS – endpoint /api/taapi/test returned ${response.status}.`);
      return true;
    } else {
      console.log(`Status: ${response.status}`);
      console.log(`TAAPI Auth: FAILED – status ${data.status || response.status}`);
      if (data.data) {
        console.log('Response:', JSON.stringify(data.data, null, 2));
      }
      return false;
    }
  } catch (error) {
    console.log(`ERROR: ${error.message}`);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTaapiHealthCheck().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { runTaapiHealthCheck };