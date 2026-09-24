export const extractCodeArtifacts = (text) => {
  if (!text || typeof text !== "string") return null;
  const codeBlockRegex = /```([a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/g;
  const files = [];
  let match;
  let index = 1;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const lang = (match[1] || "javascript").toLowerCase();
    const code = match[2].trim();
    if (!code || lang === "mermaid" || lang === "diagram" || lang === "json") continue;
    let filename = `file${index}.${lang === "html" ? "html" : lang === "css" ? "css" : lang === "python" ? "py" : lang === "typescript" || lang === "ts" ? "ts" : "js"}`;
    if (lang === "html" && !files.find((f) => f.name === "index.html")) filename = "index.html";
    else if (lang === "css" && !files.find((f) => f.name === "style.css")) filename = "style.css";
    else if ((lang === "js" || lang === "javascript") && !files.find((f) => f.name === "script.js")) filename = "script.js";

    files.push({ name: filename, content: code });
    index++;
  }
  if (files.length > 0) {
    return [
      {
        id: Date.now(),
        type: "Project",
        title: "Generated Code Project",
        files
      }
    ];
  }
  return null;
};
