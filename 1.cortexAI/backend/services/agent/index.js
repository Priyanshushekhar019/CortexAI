import "dotenv/config"
import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import connectDb from "./config/db.js"
import router from "./routes/agent.route.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filesDir = path.join(__dirname, "temp/files")
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true })
}

const port = process.env.AGENT_PORT || 8003

const app = express()

app.use(express.json())

// Serve generated files with CORS and attachment headers for offline saving
app.use("/files", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (req.method === "OPTIONS") return res.status(200).end();
    next();
}, express.static(filesDir, {
    setHeaders: (res, filePath) => {
        const filename = path.basename(filePath);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    }
}))

app.use("/", router)

app.use((err, req, res, next) => {
  console.error("Agent service error handler:", err)

  if (err.status) {
    return res.status(err.status).json(err.data)
  }

  return res.status(500).json({ message: `agent error: ${err?.message || err}` })
})

app.get("/", (req, res) => {
    res.json({ message: "hello from agent" })
})

app.listen(port, () => {
    console.log(`agent started at ${port}`)
    connectDb()
})
