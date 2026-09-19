import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return typeof process.env.FIREBASE_SERVICE_ACCOUNT === "string"
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env:", e);
    }
  }

  const possiblePaths = [
    path.join(__dirname, "../serviceAccountKey.json"),
    path.join(process.cwd(), "serviceAccountKey.json"),
    path.join(process.cwd(), "services/agent/serviceAccountKey.json"),
    path.join(process.cwd(), "1.cortexAI/backend/services/agent/serviceAccountKey.json"),
    "/etc/secrets/serviceAccountKey.json"
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch (e) {
        console.error("Error reading service account file:", filePath, e);
      }
    }
  }

  return null;
};

let bucket = null;

try {
  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "cortexai-54a5c.firebasestorage.app";
    const app = getApps().length === 0 ? initializeApp({
      credential: cert(serviceAccount),
      storageBucket: bucketName
    }) : getApps()[0];

    bucket = getStorage(app).bucket(bucketName);
  }
} catch (e) {
  console.warn("Firebase Storage initialization warning:", e.message);
}

export { bucket };
