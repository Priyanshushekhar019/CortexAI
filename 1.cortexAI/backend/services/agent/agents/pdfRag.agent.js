import fs from "fs"
import { PDFParse } from "pdf-parse"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { vectorStore } from "../config/vectorDb.js"
import { getModel } from "../config/llmModels.js"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"

export const pdfRag = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf")
        
        if (!state.file?.path || !fs.existsSync(state.file.path)) {
            return {
                ...state,
                aiResponse: "No uploaded PDF file was found. Please re-upload your PDF."
            }
        }

        const buffer = fs.readFileSync(state.file.path)
        const pdf = new PDFParse({ data: buffer })
        const result = await pdf.getText()
        const fullText = (result.text || "").trim()

        if (!fullText) {
            return {
                ...state,
                aiResponse: "The uploaded PDF appears to be empty or contains only scanned images without selectable text."
            }
        }

        let context = ""

        // If the document is moderate in size (<= 25,000 chars), provide complete context directly
        if (fullText.length <= 25000) {
            context = fullText
        } else {
            // For large documents, perform semantic search via vector database with fallback
            try {
                const splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 1000,
                    chunkOverlap: 200
                })
                const docs = await splitter.createDocuments([fullText])
                const collectionName = `pdf-${Date.now()}`
                const store = await vectorStore(docs, collectionName)
                const relevantDocs = await store.similaritySearch(state.prompt || "summarize document", 8)
                context = relevantDocs.map(d => d.pageContent).join("\n\n")
            } catch (ragError) {
                console.warn("Vector search failed, falling back to direct head chunking:", ragError.message)
                context = fullText.slice(0, 25000)
            }
        }

        const llm = await getModel("pdf")

        const messages = [
            new SystemMessage(`You are CortexAI PDF Assistant.

Rules:
- Answer accurately and comprehensively using the uploaded PDF document below.
- Extract requested sections, lists, bullet points, and details directly from the PDF.
- If the requested information is not in the document, state clearly what is missing.
- Use clean Markdown formatting with headers and bullet points.`),
            new HumanMessage(`Document Content:
${context}

User Request:
${state.prompt || "Please analyze and summarize this PDF."}`)
        ]

        const response = await llm.invoke(messages)
        await deductCredits(state.userId, "pdf")

        return {
            ...state,
            aiResponse: response.content
        }

    } catch (error) {
        console.error("PDF RAG agent error:", error)
        return {
            ...state,
            aiResponse: error?.data?.message || error?.message || "failed to analyze pdf"
        }
    } finally {
        if (state.file?.path && fs.existsSync(state.file.path)) {
            try {
                fs.unlinkSync(state.file.path)
            } catch (e) {
                console.error("Error removing temp PDF file:", e)
            }
        }
    }
}