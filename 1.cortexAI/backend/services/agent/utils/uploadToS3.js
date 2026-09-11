import { bucket } from "../config/storage.js";

export const uploadToS3 = async (filename, buffer, contentType) => {
  try {
    const file = bucket.file(filename);
    await file.save(buffer, {
      metadata: {
        contentType: contentType
      }
    });
    return filename;
  } catch (error) {
    console.error("Firebase storage upload error:", error);
    throw error;
  }
};