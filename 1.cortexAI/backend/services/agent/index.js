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
app.use("/files", express.static(filesDir))
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
