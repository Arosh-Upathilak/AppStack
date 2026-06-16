# AppStack Load Testing

This directory contains a programmatic load testing script using `autocannon` to baseline the performance of AppStack's public and health endpoints.

## Run instructions

1. Navigate to this directory:
   ```bash
   cd loadtest
   ```

2. Install dependencies:
   ```bash
   npm install autocannon
   ```

3. Run the load test against your local or staging server:
   ```bash
   # Defaults to http://localhost:5001
   TARGET_URL="http://localhost:5001" node loadtest.js
   ```
