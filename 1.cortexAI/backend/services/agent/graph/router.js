import { getModel } from "../config/llmModels.js"

export const router = async (state) => {
  // If a file is uploaded, prioritize file analysis agents
  if (state.file) {
    const isPdf = state.file.mimetype === "application/pdf" || 
                  state.file.originalname?.toLowerCase().endsWith(".pdf") ||
                  state.file.filename?.toLowerCase().endsWith(".pdf");
    
    if (isPdf) {
      return {
        ...state,
        agent: "pdfRag"
      }
    }

    const isImage = state.file.mimetype?.startsWith("image/") ||
                    /\.(jpg|jpeg|png|webp|gif)$/i.test(state.file.originalname || "");
    if (isImage) {
      return {
        ...state,
        agent: "imageAnalyzer"
      }
    }
  }

  // If user explicitly chose a specific agent (other than auto), honor their selection
  if (state.agent && state.agent !== "auto") {
    const mapped = state.agent === "team" ? "swarm" : state.agent;
    return {
      ...state,
      agent: mapped
    }
  }

  const llm = await getModel("router")
  const prompt = `You are an agent router.

Available agents:
- chat
- search
- coding
- pdf
- ppt
- vision
- swarm

Rules:
chat: General conversation, explanations, learning, simple questions.
search: Current events, latest information, news, recent developments, internet lookup.
coding: Generate code, debug code, build simple components, architecture.
pdf: Requests to generate or create a new PDF document.
ppt: Requests to generate or create a presentation slide deck.
vision: Requests to generate or create an image.
swarm: Complex multi-step projects, end-to-end full app builds with market research, team collaboration requests.

Return ONLY one word (chat, search, coding, pdf, ppt, vision, swarm):

User Query:
${state.prompt}`

  const response = await llm.invoke(prompt)
  const agentName = response.content.trim().toLowerCase().replace(/[^a-z]/g, "")

  return {
    ...state,
    agent: agentName || "chat"
  }
}