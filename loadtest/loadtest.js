const autocannon = require("autocannon");

const targetUrl = process.env.TARGET_URL || "http://localhost:5001";

console.log(`\n========================================================`);
console.log(` 🔥 Starting AppStack Load Test against: ${targetUrl}`);
console.log(` Running for 10 seconds with 50 concurrent connections...`);
console.log(`========================================================\n`);

const instance = autocannon({
  url: targetUrl,
  connections: 50,
  pipelining: 1,
  duration: 10,
  requests: [
    {
      method: "GET",
      path: "/health"
    },
    {
      method: "GET",
      path: "/api/products"
    }
  ]
}, (err, result) => {
  if (err) {
    console.error("❌ Error running load test:", err);
    process.exit(1);
  }
  console.log("\n========================================================");
  console.log(" 🎉 Load Test Completed!");
  console.log("========================================================");
  console.log(` 📦 Total requests: ${result.requests.total}`);
  console.log(` ⏱️ Average throughput: ${Math.round(result.requests.average)} reqs/sec`);
  console.log(` 📥 Total data read: ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB`);
  console.log(` 🚀 Average Latency: ${result.latency.average} ms`);
  console.log(` 🚨 Max Latency: ${result.latency.max} ms`);
  console.log(` 📊 99th Percentile: ${result.latency.p99} ms`);
  console.log("========================================================\n");
});

autocannon.track(instance, { renderProgressBar: true });
