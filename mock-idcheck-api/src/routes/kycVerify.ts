import { Router } from "express";
import { kycVerifyHandler } from "../handlers/kycVerify";
import { authenticateToken } from "../middleware/apiKeyValidator";
import upload from "../middleware/uploadMiddleware";

const router = Router();

/**
 * @swagger
 * /api/kyc/verify:
 *   post:
 *     summary: Verify user's identity using submitted KYC data
 *     description: |
 *       This mock endpoint checks if the submitted KYC details match any known sample records.
 *       Requires a Bearer token via the `Authorization` header.
 *     tags:
 *       - Mock KYC API
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
 *                 description: Type of ID document.
 *               fullName:
 *                 type: string
 *                 description: Full legal name.
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (e.g. 1995-01-01).
 *               idExpDate:
 *                 type: string
 *                 format: date
 *                 description: Expiration date of ID.
 *               idNumber:
 *                 type: string
 *                 description: ID number.
 *               placeOfIssue:
 *                 type: string
 *                 description: Issuing authority/location.
 *               idPhoto:
 *                 type: string
 *                 format: binary
 *                 description: Upload of ID photo.
 *               selfieWithId:
 *                 type: string
 *                 format: binary
 *                 description: Upload of selfie with ID.
 *     responses:
 *       200:
 *         description: KYC verification result
 *       400:
 *         description: Missing files or invalid form fields
 *       401:
 *         description: Missing or malformed Authorization header
 *       403:
 *         description: Invalid token
 */

router.post(
  "/verify",
  authenticateToken,
  upload.fields([
    { name: "idPhoto", maxCount: 1 },
    { name: "selfieWithId", maxCount: 1 },
  ]),
  kycVerifyHandler
);
export default router;
