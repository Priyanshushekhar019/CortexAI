import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import serviceAccount from "../serviceAccountKey.json" with { type: "json" };

const app = getApps().length === 0 ? initializeApp({
  credential: cert(serviceAccount),
  storageBucket: "cortexai-54a5c.firebasestorage.app"
}) : getApps()[0];

export const bucket = getStorage(app).bucket("cortexai-54a5c.firebasestorage.app");
