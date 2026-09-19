import { getModel } from "../config/llmModels.js"
import { generatePpt } from "../utils/generatePpt.js"
import { getFromS3 } from "../utils/getFromS3.js"
import { uploadToS3 } from "../utils/uploadToS3.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"

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

export const pptAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "ppt")
        const llm = await getModel("ppt")
        const prompt = `You are a professional presentation designer.

Return ONLY valid JSON.
Do NOT return markdown code blocks or explanations.

Format:
{
"title":"",
"subtitle":"",
"slides":[
{
"title":"",
"points":[
"",
"",
"",
""
]
}
]
}

Rules:
- Generate exactly 6 content slides.
- Each slide should have 4-6 concise bullet points.
- Return ONLY JSON.

Topic:
${state.prompt}`

        const res = await llm.invoke(prompt)
        const data = parseJsonResponse(res.content)
        await deductCredits(state.userId, "ppt")
        const ppt = await generatePpt(data)
        const buffer = await ppt.write({
            outputType: "nodebuffer"
        })

        const filename = `ppt-${Date.now()}.pptx`

        await uploadToS3(filename, buffer, "application/vnd.openxmlformats-officedocument.presentationml.presentation")
        const downloadUrl = await getFromS3(filename, 24 * 60)

        return {
            ...state,
            aiResponse: `# 📊 Presentation Generated

**${data.title || "Generated Presentation"}**
${data.subtitle ? `\n_${data.subtitle}_\n` : ""}

📥 [Download PPT](${downloadUrl})`
        }

    } catch (error) {
        console.error("PPT agent error:", error)
        return {
            ...state,
            aiResponse: error?.data?.message || error?.message || "failed to generate ppt"
        }
    }
}