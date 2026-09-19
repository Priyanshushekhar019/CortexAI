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
const port = process.env.PORT || 8000

const app = express()
const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL?.replace(/\/$/, ""),
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://cortex-ai-mu-two.vercel.app"
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, "");
        const isAllowed = allowedOrigins.some(o => o.replace(/\/$/, "") === cleanOrigin) ||
                          origin.endsWith(".vercel.app") ||
                          origin.includes("localhost");
        if (isAllowed) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "Accept"],
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions))
app.options("*", cors(corsOptions))
app.use(morgan("dev"))
app.use(cookieParser())

const authService = process.env.AUTH_SERVICE || "http://localhost:8001"
const chatService = process.env.CHAT_SERVICE || "http://localhost:8002"
const agentService = process.env.AGENT_SERVICE || "http://localhost:8003"
const billingService = process.env.BILLING_SERVICE || "http://localhost:8004"

app.use("/api/auth", proxy(authService, {
    timeout: 120000,
    proxyErrorHandler: function(err, res, next) {
        console.error("Auth proxy error:", err);
        res.status(500).json({ message: "Auth service connection error", error: err?.message });
    }
}))
app.use("/api/chat", protect, proxyWithHeader(chatService))
app.use("/api/agent", protect, proxyWithHeader(agentService))
app.use("/api/billing", protect, proxyWithHeader(billingService))
app.use("/api/files", proxy(agentService, {
    timeout: 120000,
    proxyReqPathResolver: function (req) {
        return "/files" + req.url;
    }
}))
app.get("/api/me", protect, getCurrentUser)
app.get("/", (req, res) => {
    res.json({ message: "hello from gateway v5" })
})

app.listen(port, () => {
    console.log(`gateway started at ${port}`)
})

