const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 4000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "your_webhook_secret";
const APPSTACK_API = process.env.APPSTACK_API || "http://localhost:5001";

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.post("/webhook", (req, res) => {
  const signature = req.headers["x-appstack-signature"];
  const eventId = req.headers["x-appstack-event-id"];

  console.log(`\n[MockSaaS] 📩 Received Webhook Event ID: ${eventId}`);

  if (!signature) {
    console.error("[MockSaaS] ❌ Missing X-AppStack-Signature header");
    return res.status(401).send("Missing signature header");
  }

  // Verify signature
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(req.rawBody || "");
  const expectedSignature = hmac.digest("hex");

  if (signature !== expectedSignature) {
    console.error("[MockSaaS] ❌ Invalid signature! HMAC verification failed");
    return res.status(401).send("Invalid signature");
  }

  const payload = req.body;
  console.log("[MockSaaS] ✅ Signature verified.");
  console.log("[MockSaaS] Payload:", JSON.stringify(payload, null, 2));

  // Determine acknowledgement action based on event type
  let action = null;
  if (payload.event === "subscription.created") {
    action = "activate";
  } else if (payload.event === "subscription.updated") {
    action = "change_applied";
  } else if (payload.event === "subscription.cancelled") {
    action = "cancel_applied";
  }

  if (action && payload.data && payload.data.subscriptionId) {
    const subscriptionId = payload.data.subscriptionId;
    console.log(`[MockSaaS] ⚙️ Processing action "${action}" for subscription ${subscriptionId}...`);

    // Simulate async processing (wait 1.5 seconds before ack)
    setTimeout(async () => {
      try {
        console.log(`[MockSaaS] 📤 Sending ack to AppStack for ${subscriptionId}...`);
        const response = await axios.post(
          `${APPSTACK_API}/api/integrations/subscriptions/${subscriptionId}/ack`,
          {
            eventId: eventId,
            action: action,
            accepted: true,
            message: `MockSaaS auto-provisioned. Event ${eventId} acknowledged successfully.`
          },
          {
            headers: {
              "Authorization": `Bearer ${WEBHOOK_SECRET}`,
              "Content-Type": "application/json"
            }
          }
        );
        console.log(`[MockSaaS] 🎉 Ack Response status: ${response.status}. data:`, response.data);
      } catch (err) {
        console.error(
          `[MockSaaS] ❌ Ack call failed:`,
          err.response ? err.response.data : err.message
        );
      }
    }, 1500);
  } else {
    console.log(`[MockSaaS] ℹ️ Event "${payload.event}" does not require subscription lifecycle acknowledgement.`);
  }

  return res.status(200).json({ success: true, message: "Webhook received" });
});

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`   🚀 Mock SaaS Receiver running on port ${PORT}`);
  console.log(`   📬 Send webhooks to: http://localhost:${PORT}/webhook`);
  console.log(`   🔐 Webhook Secret: ${WEBHOOK_SECRET}`);
  console.log(`   🔗 AppStack API Target: ${APPSTACK_API}`);
  console.log(`========================================================`);
});
