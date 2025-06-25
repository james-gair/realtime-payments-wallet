import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "../serviceAccountKey.json";

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

export default {
  auth: getAuth,
};