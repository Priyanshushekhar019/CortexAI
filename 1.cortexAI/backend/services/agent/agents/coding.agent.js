import { checkAgentLimit } from "../config/agentLimit.js"
import { getModel } from "../config/llmModels.js"
import { deductCredits } from "../utils/deductCredits.js"

const parseJsonResponse = (content) => {
    if (typeof content !== "string") return content;
    let clean = content.trim();
    if (clean.includes("```")) {
        const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            clean = match[1].trim();
        }
    }
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(clean);
};

export const codingAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "coding")
        const intentLlm = await getModel("intent")
        const llm = await getModel("coding")
        
        const intentRes = await intentLlm.invoke(`
        You are an intent classifier.

Return ONLY one of these values:
CODE_GENERATION
CODE_REVIEW
CODE_EXPLANATION
DEBUGGING
OPTIMIZATION
CONVERSION
DOCUMENTATION

User Request:
${state.prompt}
        `)
        
        const intent = intentRes.content.trim()

        if (intent.includes("CODE_GENERATION")) {
            const prompt = `You are CortexAI Coding Agent.

Generate the requested complete, beautiful web project.

Default stack:
- HTML (index.html)
- CSS (style.css)
- JavaScript (script.js)

Use React / Next.js / Vue ONLY if explicitly requested.

Design & Quality Rules:
- Highly modern, sleek UI with glassmorphism or smooth dark mode
- Responsive layout (Flexbox/Grid)
- Smooth transitions and hover micro-animations
- High quality typography and color tokens
- Always use real working Unsplash images if photos are needed: https://images.unsplash.com/...
- Never use broken placeholders

Return ONLY valid JSON.

Schema:
{
  "files":[
    {
      "name":"index.html",
      "content":"<!DOCTYPE html>..."
    },
    {
      "name":"style.css",
      "content":"/* CSS */"
    },
    {
      "name":"script.js",
      "content":"// JS"
    }
  ]
}

User Request:
${state.prompt}`

            const res = await llm.invoke(prompt)
            const data = parseJsonResponse(res.content)
            await deductCredits(state.userId, "coding")
            
            return {
                ...state,
                aiResponse: `### 💻 Project Generated Successfully\n\nI have created **${(data.files || []).length} project files** for your request.\nYou can preview and live-edit the code in the **Artifact panel** on the right.`,
                artifacts: [
                    {
                        id: Date.now(),
                        type: "Project",
                        files: data.files || [],
                        title: state.prompt
                    }
                ]
            }
        }

        const res = await llm.invoke(`
The user's request is:
${intent}

Provide a comprehensive, high quality response using clean Markdown.
If architectural flows, algorithms, or sequence diagrams help explain the code, include interactive Mermaid diagrams with \`\`\`mermaid ... \`\`\`.

User Request:
${state.prompt}
        `)

        const data = res.content
        await deductCredits(state.userId, "coding")
        
        return {
            ...state,
            aiResponse: data,
            artifacts: []
        }
    } catch (error) {
        console.error("Coding agent error:", error)
        return {
            ...state,
            aiResponse: error?.data?.message || error?.message || "failed to generate code",
            artifacts: []
        }
    }
}