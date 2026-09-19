import { getModel } from "../config/llmModels.js"
import { generatePdf } from "../utils/generatePdf.js"
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

export const pdfAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf")
        
        const llm = await getModel("pdf")
        const prompt = `You are an expert document writer.

Return ONLY valid JSON.
Do NOT return markdown code blocks or explanations.

Structure:
{
"title":"",
"subtitle":"",
"sections":[
{
"heading":"",
"points":[]
}
]
}

Generate 4-8 sections.
Each section should have 3-6 concise bullet points.

Topic:
${state.prompt}`

        const res = await llm.invoke(prompt)
        const data = parseJsonResponse(res.content)
        await deductCredits(state.userId, "pdf")
        
        const pdfBuffer = await generatePdf(data)
        const filename = `pdf-${Date.now()}.pdf`
        await uploadToS3(filename, pdfBuffer, "application/pdf")
        const downloadUrl = await getFromS3(filename, 24 * 60)

        return {
          ...state,
          aiResponse: `# 📄 PDF Generated

**${data.title || "Generated Document"}**
${data.subtitle ? `\n_${data.subtitle}_\n` : ""}

📥 [Download PDF](${downloadUrl})`
        }

    } catch (error) {
       console.error("PDF agent error:", error)
       return {
            ...state,
            aiResponse: error?.data?.message || error?.message || "failed to generate pdf"
       }
    }
}