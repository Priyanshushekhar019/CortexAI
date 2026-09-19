import { getModel } from "../config/llmModels.js"
import axios from "axios"
import { uploadToS3 } from "../utils/uploadToS3.js"
import { getFromS3 } from "../utils/getFromS3.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentLimit.js"

export const visionAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "vision")
        const llm = await getModel("vision")
        const res = await llm.invoke(`
        You are an elite AI image prompt engineer.

Convert the user request into a highly detailed image generation prompt in English.

Requirements:
- Cinematic lighting
- Professional composition
- Ultra realistic
- High detail
- Beautiful color palette
- Sharp focus
- 8K quality
- Photorealistic
- Depth of field
- Professional photography
- Stunning visuals

Return ONLY the image prompt text. Do not return markdown, quotes, or explanations.

User Request:
${state.prompt}
        `)

        const prompt = res.content.trim().replace(/^["']|["']$/g, "")
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`

        let buffer = null
        try {
            const imageRes = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 25000 })
            buffer = Buffer.from(imageRes.data)
        } catch (downloadErr) {
            console.warn("Pollinations direct buffer download warning:", downloadErr.message)
        }

        await deductCredits(state.userId, "vision")

        let downloadUrl = imageUrl
        if (buffer) {
            const filename = `image-${Date.now()}.png`
            await uploadToS3(filename, buffer, "image/png")
            downloadUrl = await getFromS3(filename, 24 * 60)
        }

        return {
            ...state,
            images: [imageUrl],
            aiResponse: `# 🎨 Generated Image

![Generated Image](${imageUrl})

📥 [Download Image](${downloadUrl})`
        }
    } catch (error) {
       console.error("Vision agent error:", error)
       return {
            ...state,
            aiResponse: error?.data?.message || error?.message || "failed to generate image"
       }
    }
}