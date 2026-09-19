import dotenv from "dotenv"
dotenv.config()
import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenRouter } from "@langchain/openrouter";

const groq = process.env.GROQ_API_KEY ? new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b"
}) : null

const gemini = process.env.GOOGLE_API_KEY ? new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-flash-latest"
}) : null

const openrouter = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== "add your open router api key" ? new ChatOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "deepseek/deepseek-chat",
    temperature: 0,
    maxTokens: 2500
}) : null


export const getModel = async (agent) => {
    switch (agent) {
        case "chat":
            return groq || gemini;
        case "search":    
            return groq || gemini;
        case "coding": 
            return openrouter || groq || gemini; 
        case "imageAnalyzer": 
            return gemini || groq;
        case "pdf":
            return groq || gemini;
        case "ppt":
            return groq || gemini;
        case "vision":
        case "image":
            return groq || gemini;
        default:
            return groq || gemini;
    }
}
