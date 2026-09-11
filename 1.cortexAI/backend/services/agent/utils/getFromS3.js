import { bucket } from "../config/storage.js";

export const getFromS3 = async (filename, expiresInMinutes = 600) => {
  try {
    const file = bucket.file(filename);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + expiresInMinutes * 60 * 1000
    });
    return url;
  } catch (error) {
    console.error("Firebase storage signed url error:", error);
    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
  }
};