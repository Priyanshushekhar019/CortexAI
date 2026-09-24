import express from "express"
import dotenv from "dotenv"
import proxy from "express-http-proxy"
dotenv.config()
import cookieParser from "cookie-parser"
import { getCurrentUser } from "./controllers/user.controller.js"
import protect from "./middleware/auth.middleware.js"
import { proxyWithHeader } from "./utils/proxyWithHeader.js"
import morgan from "morgan"

const port = process.env.PORT || 8000

const app = express()
app.set("trust proxy", 1)

// Comprehensive CORS Middleware for all incoming origins and preflight
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-id, Accept, Origin, X-Requested-With");
        res.setHeader("Access-Control-Expose-Headers", "Set-Cookie");
    }

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

app.use(morgan("dev"))
app.use(cookieParser())

const authService = process.env.AUTH_SERVICE || "http://localhost:8001"
const chatService = process.env.CHAT_SERVICE || "http://localhost:8002"
const agentService = process.env.AGENT_SERVICE || "http://localhost:8003"
const billingService = process.env.BILLING_SERVICE || "http://localhost:8004"

app.use("/api/auth", proxy(authService, {
    timeout: 120000,
    userResHeaderDecorator(headers, userReq) {
        if (userReq.headers.origin) {
            headers["access-control-allow-origin"] = userReq.headers.origin;
            headers["access-control-allow-credentials"] = "true";
        }
        return headers;
    },
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
    userResHeaderDecorator(headers, userReq) {
        const origin = userReq.headers.origin || "*";
        headers["access-control-allow-origin"] = origin;
        if (userReq.headers.origin) {
            headers["access-control-allow-credentials"] = "true";
        }
        headers["cross-origin-resource-policy"] = "cross-origin";
        return headers;
    },
    proxyReqPathResolver: function (req) {
        return "/files" + req.url;
    }
}))
app.get("/api/me", protect, getCurrentUser)
app.get("/", (req, res) => {
    res.json({ message: "hello from gateway v6" })
})

app.listen(port, () => {
    console.log(`gateway started at ${port}`)
})


