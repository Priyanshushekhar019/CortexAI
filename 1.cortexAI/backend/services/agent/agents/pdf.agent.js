import { getModel } from "../config/llmModels.js";
import { generatePdf } from "../utils/generatePdf.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

const parseJsonResponse = (content, defaultTitle = "Generated Document") => {
  if (typeof content !== "string") return content;
  let clean = content.trim();

  // Strip markdown code fences if present
  if (clean.includes("```")) {
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      clean = match[1].trim();
    }
  }

  // Find outermost JSON object
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace < lastBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    // Attempt minor JSON cleanup for trailing commas or bad escapes
    try {
      const sanitized = clean
        .replace(/,\s*([\]}])/g, "$1")
        .replace(/[\u0000-\u0019]+/g, "");
      return JSON.parse(sanitized);
    } catch (_) {
      console.warn("PDF Agent JSON parsing failed, falling back to structured markdown wrapper.");
      // Fallback: wrap raw response text into a valid PDF document structure
      const lines = clean.split("\n").map(l => l.trim()).filter(Boolean);
      return {
        title: defaultTitle,
        subtitle: "",
        sections: [
          {
            heading: "Document Content",
            type: "paragraphs",
            content: lines.join("\n\n")
          }
        ]
      };
    }
  }
};

export const pdfAgent = async (state) => {
  try {
    await checkAgentLimit(state.userId, "pdf");

    const llm = await getModel("pdf");
    const prompt = `You are an expert document generator.
Your objective is to generate a comprehensive, accurate document adhering STRICTLY to the user's instructions and requested format.

CRITICAL RULES:
1. ALWAYS fulfill the exact content requested by the user. If the user asks for "write numbers from 1 to 100", you MUST include every single number from 1 to 100 in order without skipping, omitting, or truncating any item.
2. If the user asks for an article, report, guide, tutorial, list, or summary, generate thorough, high-quality, professional content.
3. Structure your response as valid JSON matching the schema below.

JSON Schema:
{
  "title": "Document Title",
  "subtitle": "Optional descriptive subtitle",
  "sections": [
    {
      "heading": "Section Heading (optional)",
      "type": "numbered_list" | "bullet_list" | "paragraphs",
      "content": "Paragraph text (for type 'paragraphs')",
      "items": ["Item 1", "Item 2", "Item 3", "..."] // for 'numbered_list' or 'bullet_list'
    }
  ]
}

For sequential numbers (e.g. 1 to 100), use:
{
  "title": "Numbers 1 to 100",
  "subtitle": "Complete sequential list",
  "sections": [
    {
      "heading": "Numbers (1 - 100)",
      "type": "numbered_list",
      "items": ["1", "2", "3", ... "100"]
    }
  ]
}

Return ONLY valid JSON. No markdown codeblocks, no explanations.

User Request:
${state.prompt}`;

    const res = await llm.invoke(prompt);
    const data = parseJsonResponse(res.content, state.prompt);
    await deductCredits(state.userId, "pdf");

    const pdfBuffer = await generatePdf(data);
    const filename = `pdf-${Date.now()}.pdf`;
    await uploadToS3(filename, pdfBuffer, "application/pdf");
    const downloadUrl = await getFromS3(filename, 24 * 60);

    const sectionSummary = data?.sections?.map(s => `• **${s.heading || "Section"}**: ${s.items?.length ? `${s.items.length} items` : 'Content generated'}`).join("\n") || "";

    return {
      ...state,
      aiResponse: `# 📄 PDF Generated Successfully

**${data.title || "Generated Document"}**
${data.subtitle ? `_${data.subtitle}_\n` : ""}

${sectionSummary ? `### Summary of Contents:\n${sectionSummary}\n` : ""}

📥 [Download PDF](${downloadUrl})`
    };
  } catch (error) {
    console.error("PDF agent error:", error);
    return {
      ...state,
      aiResponse: error?.data?.message || error?.message || "Failed to generate PDF. Please try again."
    };
  }
};