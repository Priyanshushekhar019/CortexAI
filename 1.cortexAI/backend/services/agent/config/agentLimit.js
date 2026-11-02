import redis from "../../../shared/redis/redis.js"

// Rate limits per agent type (requests per 60-second window)
const Limits = {
    chat: 20,
    search: 10,
    coding: 5,
    pdf: 5,
    pdfrag: 5,
    ppt: 5,
    image: 5,
    vision: 5,
    imageanalyzer: 5,
    swarm: 3,
    team: 3
}

/**
 * Checks and increments Redis rate limit for an agent request.
 * Throws 429 error if limit is exceeded in the 60s sliding window.
 */
export const checkAgentLimit = async (userId, agent) => {
    try {
        if (!redis) {
            console.warn("Redis client not initialized, bypassing rate limit check.");
            return { remaining: 999, limit: 999 };
        }

        const agentKey = (agent || "chat").toLowerCase().replace(/[^a-z]/g, "")
        const max = Limits[agentKey] || Limits["chat"]
        const userKey = userId || "anonymous"
        const key = `rate:${userKey}:${agentKey}`

        const count = await redis.incr(key)
        if (count === 1) {
            await redis.expire(key, 60)
        }

        const ttl = await redis.ttl(key)

        if (count > max) {
            const minutes = Math.floor(ttl / 60)
            const seconds = (ttl % 60)
            const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

            const error = new Error(`Rate limit exceeded for ${agentKey}.`);
            error.status = 429
            error.data = {
                success: false,
                agent: agentKey,
                limit: max,
                remainingTime: ttl,
                retryAfter: timeStr,
                message: `You have reached the ${agentKey} limit (${max} requests/minute). Please try again in ${timeStr}.`
            }

            throw error
        }

        return {
            remaining: Math.max(0, max - count),
            limit: max,
            ttl
        }
    } catch (err) {
        // Re-throw genuine 429 rate limit errors
        if (err.status === 429) {
            throw err
        }
        // If Redis has temporary network glitch, log and do not block the user
        console.warn("Redis rate limit check error (allowing request):", err?.message || err)
        return { remaining: 1, limit: 1 }
    }
}

/**
 * Express Middleware for route-level Redis rate limiting
 */
export const agentRateLimitMiddleware = (agentName = "chat") => {
    return async (req, res, next) => {
        try {
            const userId = req.headers["x-user-id"] || req.ip || "anonymous"
            const requestedAgent = req.body?.agent || agentName
            await checkAgentLimit(userId, requestedAgent)
            next()
        } catch (error) {
            if (error.status === 429) {
                return res.status(429).json(error.data || {
                    success: false,
                    message: error.message
                })
            }
            next(error)
        }
    }
}
