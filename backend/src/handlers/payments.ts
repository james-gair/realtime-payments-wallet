import { Request, Response } from "express";
import sql from "../database/client";
import { zaiService } from "../services/zaiService";

export async function getBankPayInDetails(req: Request, res: Response) {
  const firebase_id = (req as any).user?.uid;

  try {
    // 1. Get the user's Zai ID from our DB
    const userResult = await sql`
      SELECT zai_user_id FROM Account WHERE firebase_id = ${firebase_id}
    `;

    if (userResult.length === 0 || !userResult[0].zai_user_id) {
      return res.status(404).json({ error: "Zai user account not found." });
    }
    const zaiUserId = userResult[0].zai_user_id;

    // 2. Fetch the user's wallet account to check for an existing PayID
    const walletDetails = await zaiService.getWalletBalance(zaiUserId);
    const wallet_id = walletDetails.wallet_accounts?.id;

    // 3. Fetch the wallet NPP details
    const nppDetails = await zaiService.getWalletNppDetails(wallet_id);
    let payId = nppDetails.npp_details?.pay_id;
    if (!payId) {
      console.log(await zaiService.createVirtualAccount(wallet_id));
      const nppDetails = await zaiService.getWalletNppDetails(wallet_id);
      payId = nppDetails.npp_details?.pay_id;
    }

    // 4. Return the PayID to the user
    // The user will use this ID in their banking app to send money.
    const payIdDetails = {
      payId: payId,
      instruction:
        "Use this PayID in your banking app to add money to your wallet instantly.",
    };

    res.status(200).json(payIdDetails);
  } catch (error: any) {
    console.error("Failed to get PayID details:", error);
    if (error.response) {
      console.error(
        "Zai API Error on PayID:",
        JSON.stringify(error.response.data, null, 2)
      );
    }
    res
      .status(500)
      .json({ error: "An error occurred while fetching PayID details." });
  }
}

export async function addMoney(req: Request, res: Response) {
  try {
    const { amount, currency, walletId, paymentMethod } = req.body;

    if (!amount || !currency || !walletId || !paymentMethod) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const walletDetails = await sql`
      SELECT balance FROM Wallet WHERE wallet_id = ${walletId}
    `;

    if (walletDetails.length === 0) {
      return res.status(404).json({ error: "Wallet not found." });
    }
    const balance = walletDetails[0].balance;

    const newBalance = parseFloat(balance) + parseFloat(amount);

    await sql`
      UPDATE Wallet SET balance = ${newBalance} WHERE wallet_id = ${walletId}
    `;

    console.log(newBalance);
    res.status(200).json({ message: "Money added successfully." });
  } catch (error: any) {
    console.error("Failed to add money:", error);
    res.status(500).json({ error: "An error occurred while adding money." });
  }
}
