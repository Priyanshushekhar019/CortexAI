import express from "express"
import dotenv from "dotenv"
import proxy from "express-http-proxy"
dotenv.config()
import cors from "cors"
import cookieParser from "cookie-parser"
import { getCurrentUser } from "./controllers/user.controller.js"
import protect from "./middleware/auth.middleware.js"
import { proxyWithHeader } from "./utils/proxyWithHeader.js"
import morgan from "morgan"
const port =process.env.PORT

const app=express()
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL?.replace(/\/$/, ""),
    "http://localhost:5173",
    "https://cortex-ai-mu-two.vercel.app"
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, "");
        const isAllowed = allowedOrigins.some(o => o.replace(/\/$/, "") === cleanOrigin);
        if (isAllowed) {
            return callback(null, true);
        }
        return callback(null, origin);
    },
    credentials: true
}))
app.use(morgan("dev"))
app.use(cookieParser())
const authService = process.env.AUTH_SERVICE || "http://localhost:8001"
const chatService = process.env.CHAT_SERVICE || "http://localhost:8002"
const agentService = process.env.AGENT_SERVICE || "http://localhost:8003"
const billingService = process.env.BILLING_SERVICE || "http://localhost:8004"

app.use("/api/auth", proxy(authService, {
    proxyErrorHandler: function(err, res, next) {
        console.error("Auth proxy error:", err);
        res.status(500).json({ message: "Auth service connection error", error: err?.message });
    }
}))
app.use("/api/chat", protect, proxyWithHeader(chatService))
app.use("/api/agent", protect, proxyWithHeader(agentService))
app.use("/api/billing", protect, proxyWithHeader(billingService))
app.get("/api/me", protect, getCurrentUser)
app.get("/", (req, res) => {
    res.json({ message: "hello from gateway v5" })
})

app.listen(port, () => {
    console.log(`gateway started at ${port}`)
})
