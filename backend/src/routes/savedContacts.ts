import { Router } from "express";
import { addContact, getSavedContacts, updateContactNickname, deleteContact } from "../handlers/savedContacts";
import { authenticateFirebaseToken } from "../middleware/auth";

const router = Router();

router.get("/saved-contacts", authenticateFirebaseToken as any, getSavedContacts);
router.patch("/saved-contacts", authenticateFirebaseToken as any, updateContactNickname);
router.post("/saved-contacts", authenticateFirebaseToken as any, addContact);
router.delete("/saved-contacts/:contactId", authenticateFirebaseToken as any, deleteContact);

export default router;