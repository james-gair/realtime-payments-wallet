import { Router } from "express";
import { getSavedContacts } from "../handlers/savedContacts";
import { authenticateFirebaseToken } from "../middleware/auth";

const router = Router();

router.get("/saved-contacts", authenticateFirebaseToken as any, getSavedContacts);

export default router;