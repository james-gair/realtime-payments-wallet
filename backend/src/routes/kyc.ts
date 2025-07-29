import { Router } from "express";
import { kycHandler } from "../handlers/kyc";
import upload from "../middleware/uploadMiddleware";
import { authenticateFirebaseToken } from "../middleware/auth";
import { preventDupKyc } from "../middleware/preventDupKyc";

const router = Router();

/**
 * @swagger
 * /api/kyc:
 *   post:
 *     summary: Submit KYC verification data
 *     description: Uploads user ID documents and personal information for KYC verification.
 *     tags:
 *       - KYC
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - idType
 *               - fullName
 *               - dateOfBirth
 *               - idExpDate
 *               - idNumber
 *               - placeOfIssue
 *               - idPhoto
 *               - selfieWithId
 *             properties:
 *               idType:
 *                 type: string
 *                 enum: [passport, driver_license]
 *                 description: Type of ID document provided.
 *               fullName:
 *                 type: string
 *                 description: Full legal name as it appears on the ID.
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (e.g. 1995-08-12).
 *               idExpDate:
 *                 type: string
 *                 format: date
 *                 description: ID expiration date.
 *               idNumber:
 *                 type: string
 *                 description: Document ID number.
 *               placeOfIssue:
 *                 type: string
 *                 description: Where the ID was issued.
 *               idPhoto:
 *                 type: string
 *                 format: binary
 *                 description: A photo of the ID document.
 *               selfieWithId:
 *                 type: string
 *                 format: binary
 *                 description: A selfie of the user holding the ID.
 *     responses:
 *       200:
 *         description: KYC successful and wallet created.
 *       400:
 *         description: Invalid input or verification failed.
 *       401:
 *         description: Not authenticated.
 *       500:
 *         description: Server error.
 */
router.post(
  "/kyc",
  authenticateFirebaseToken as any,
  upload.fields([
    { name: "idPhoto", maxCount: 1 },
    { name: "selfieWithId", maxCount: 1 },
  ]),
  preventDupKyc,
  kycHandler
);

export default router;
