import "dotenv/config"
import Redis from "ioredis"

let redis;
try {
    redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            const delay = Math.min(times * 200, 2000);
            return delay;
        }
    });

    redis.on("connect", () => {
        console.log("redis connected");
    });

    redis.on("error", (err) => {
        console.warn("Redis connection notice:", err.message);
    });
} catch (error) {
    console.warn("Redis init notice:", error.message);
}

export default redis;