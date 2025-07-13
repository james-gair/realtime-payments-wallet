import { Request, Response } from "express";
import { KYCVerifyResultResponse } from "../dtos/KYCVerifyResponse";
import axios, { AxiosError } from "axios";
import FormData from "form-data";

export async function verifyKyc(form: FormData) {
  try {
    const response = await axios.post<KYCVerifyResultResponse>(
      "http://mock-idcheck-api:4001/api/kyc/verify",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.MOCK_KYC_API_TOKEN}`, // add the secret token
        },
      }
    );
    // res.ok
    return response.data;
  } catch (error) {
    // Other status code
    throw error;
  }
}
