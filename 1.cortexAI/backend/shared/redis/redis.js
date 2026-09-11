import "dotenv/config"
import Redis from "ioredis"

const redis=new Redis(process.env.REDIS_URL || "redis://localhost:6379")

redis.on("connect",()=>{
    console.log("redis connected")
})

export default redis