import { cert, initializeApp, getApps } from "firebase-admin/app";
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
    path.join(process.cwd(), "services/auth/serviceAccountKey.json"),
    path.join(process.cwd(), "1.cortexAI/backend/services/auth/serviceAccountKey.json"),
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

export const app = getApps().length === 0 ? initializeApp({
  credential: cert(serviceAccount)
}) : getApps()[0];