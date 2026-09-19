import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bucket } from "../config/storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filesDir = path.join(__dirname, "../temp/files");

export const uploadToS3 = async (filename, buffer, contentType) => {
  // Always save locally in temp/files for instant and fallback serving
  try {
    if (!fsSync.existsSync(filesDir)) {
      fsSync.mkdirSync(filesDir, { recursive: true });
    }
    await fs.writeFile(path.join(filesDir, filename), buffer);
  } catch (err) {
    console.error("Local file save error:", err);
  }

  // Attempt upload to cloud if bucket is available
  if (bucket) {
    try {
      const file = bucket.file(filename);
      await file.save(buffer, {
        metadata: {
          contentType: contentType
        }
      });
    } catch (cloudErr) {
      console.warn("Cloud storage upload warning (falling back to local file serving):", cloudErr.message);
    }
  }

  return filename;
};