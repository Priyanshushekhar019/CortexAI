import express from "express"
import dotenv from "dotenv"
import { getAuth } from "firebase-admin/auth"
import connectDb from "./config/db.js"
import router from "./routes/auth.route.js"
import { app as firebaseApp } from "./config/firebase.js"
dotenv.config()

const port = process.env.AUTH_PORT || 8001

const app=express()
app.use(express.json())
app.use("/",router)
app.get("/",(req,res)=>{
    res.json({message:"hello from auth"})
})

app.listen(port,()=>{
    console.log(`auth started at ${port}`)
    connectDb()
    if (firebaseApp) {
        // Pre-fetch Google public certificates at startup so the first user login is instantaneous
        getAuth(firebaseApp).getUsers([{ uid: "startup_warmup" }]).catch(() => {})
    }
})
