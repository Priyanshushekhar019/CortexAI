import { cert, initializeApp, getApps } from "firebase-admin/app";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const getServiceAccount = () => {
  let sa = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      sa = typeof process.env.FIREBASE_SERVICE_ACCOUNT === "string"
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT env:", e);
    }
  }

  if (!sa) {
    const possiblePaths = [
      path.join(__dirname, "../serviceAccountKey.json"),
      path.join(process.cwd(), "serviceAccountKey.json"),
      path.join(process.cwd(), "services/auth/serviceAccountKey.json"),
      path.join(process.cwd(), "1.cortexAI/backend/services/auth/serviceAccountKey.json"),
      "/etc/secrets/serviceAccountKey.json"
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        try {
          sa = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          break;
        } catch (e) {
          console.error("Error reading service account file:", e);
        }
      }
    }
  }

  if (sa && sa.private_key && typeof sa.private_key === "string") {
    sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  }

  return sa;
};

const serviceAccount = getServiceAccount();

export const app = getApps().length === 0 && serviceAccount
  ? initializeApp({ credential: cert(serviceAccount) })
  : (getApps()[0] || null);