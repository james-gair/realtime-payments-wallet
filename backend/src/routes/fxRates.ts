import { Router } from "express";
import { authenticateFirebaseToken } from "../middleware/auth";
import { getExchangeRates } from "../handlers/fxRates";

const router = Router();

router.get("/fx-rates", authenticateFirebaseToken as any, getExchangeRates as any);

export default router;