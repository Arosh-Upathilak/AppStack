import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("connect", () => {
  console.log("Redis Connected");
});

redisClient.on("ready", () => {
  console.log("🚀 Redis Ready");
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err);
});

redisClient.on("reconnecting", () => {
  console.log("Redis Reconnecting...");
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("Redis Connection Failed:", error);
    process.exit(1);
  }
};