import { bucket } from "../config/storage.js";

export const getFromS3 = async (filename, expiresInMinutes = 600) => {
  if (bucket) {
    try {
      const file = bucket.file(filename);
      const [exists] = await file.exists();
      if (exists) {
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: Date.now() + expiresInMinutes * 60 * 1000
        });
        return url;
      }
    } catch (error) {
      console.warn("Firebase storage signed url warning:", error.message);
    }
  }

  const serverUrl = process.env.GATEWAY_URL || process.env.SERVER_URL || "http://localhost:8000";
  return `${serverUrl.replace(/\/$/, "")}/api/files/${filename}`;
};