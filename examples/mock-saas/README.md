# Mock SaaS Webhook Receiver

This directory contains a lightweight Express server that acts as a mockup SaaS receiver to test AppStack's signed webhooks and lifecycle acknowledgement loop.

## Setup

1. Navigate to this directory:
   ```bash
   cd examples/mock-saas
   ```

2. Install dependencies:
   ```bash
   npm install express axios
   ```

3. Start the server (default port is `4000`):
   ```bash
   # Make sure to set your product's webhook secret
   WEBHOOK_SECRET="your-product-webhook-secret" node index.js
   ```

## Webhook Endpoint

The server registers `POST /webhook`. Configure your AppStack product's Webhook URL to:
```
http://localhost:4000/webhook
```

## Features

- **HMAC Signature Verification:** Verifies the `X-AppStack-Signature` header against the raw body with the `WEBHOOK_SECRET` key to ensure payloads originate from AppStack.
- **Auto-Acknowledgement:** Inspects incoming event payloads, extracts the `subscriptionId`, and sends the required `POST /api/integrations/subscriptions/:id/ack` call back to AppStack after a short delay, mimicking real-world asynchronous service provisioning.
