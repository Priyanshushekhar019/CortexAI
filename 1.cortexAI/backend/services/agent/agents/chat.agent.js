import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import { getModel } from "../config/llmModels.js"
import { getMemory } from "../config/memory.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"

export const chatAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "chat")

        const llm = await getModel("chat")

        const history = (await getMemory(state.conversationId)) || []

        const searchContext = state.searchResults ? `
Web Search Results:
${JSON.stringify(state.searchResults)}

Answer the user query accurately and comprehensively using the above search results.
` : ""

        const systemPrompt = `You are CortexAI, an intelligent and helpful AI assistant.

${searchContext}

${state.searchResults ? `Rules for search:
- Use the web search results above to answer current facts and questions.
- Do not mention internal tool names.
` : `Rules:
- For simple questions, greetings, and short queries, respond naturally in plain text.
- For technical, educational, coding, or detailed topics, use clean Markdown.
`}

Formatting Guidelines:
- Use # for main titles and ## for sections.
- Use bullet points for lists and numbered steps when applicable.
- Keep paragraphs short, clear, and readable.
- Never write headings and content on the same line.`

        const messages = [
            new SystemMessage(systemPrompt)
        ]

        if (Array.isArray(history)) {
            history.forEach(msg => {
                if (msg.role === "user") {
                    messages.push(new HumanMessage(msg.content))
                }
                if (msg.role === "assistant") {
                    messages.push(new AIMessage(msg.content))
                }
            })
        }

        messages.push(new HumanMessage(state.prompt))

        const response = await llm.invoke(messages)
        await deductCredits(state.userId, "chat")

        return {
            ...state,
            aiResponse: response.content
        }
    } catch (error) {
        console.error("Chat agent error:", error)
        return {
            ...state,
            aiResponse: error?.data?.message || error?.message || "failed to generate chat"
        }
    }
}