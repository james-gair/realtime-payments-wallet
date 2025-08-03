import { Router } from "express";
import { addContact, getSavedContacts, updateContactNickname } from "../handlers/savedContacts";
import { authenticateFirebaseToken } from "../middleware/auth";

const router = Router();

router.get("/saved-contacts", authenticateFirebaseToken as any, getSavedContacts);
router.patch("/saved-contacts", authenticateFirebaseToken as any, updateContactNickname);
router.post("/saved-contacts", authenticateFirebaseToken as any, addContact);

export default router;