import "dotenv/config";
import Redis from "ioredis";

let redis;

try {
    const rawRedisUrl = process.env.REDIS_URL 
        ? process.env.REDIS_URL.trim().replace(/^["']|["']$/g, "") 
        : "redis://redis:6379";

    redis = new Redis(
        rawRedisUrl,
        {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 200, 2000);
                return delay;
            }
        }
    );

    redis.on("connect", () => {
        console.log("Redis connected successfully");
    });

    redis.on("error", (err) => {
        console.warn("Redis connection notice:", err.message);
    });

} catch (error) {
    console.warn("Redis init notice:", error.message);
}

export default redis;
