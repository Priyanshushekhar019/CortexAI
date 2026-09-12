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
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  }

  throw new Error("Firebase serviceAccountKey.json or FIREBASE_SERVICE_ACCOUNT not found!");
};

const serviceAccount = getServiceAccount();

const app = getApps().length === 0 ? initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "cortexai-54a5c.firebasestorage.app"
}) : getApps()[0];

export const bucket = getStorage(app).bucket("cortexai-54a5c.firebasestorage.app");
