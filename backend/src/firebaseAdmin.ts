import { initializeApp, cert, getApps, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import serviceAccount from "../serviceAccountKey.json";

if (getApps().length === 0) {
  // check this works
  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
  });
}

export default {
  auth: getAuth,
};