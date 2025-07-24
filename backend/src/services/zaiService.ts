import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import * as dotenv from "dotenv";

dotenv.config();

interface ZaiAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ZaiUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip?: string;
  country: string;
  dob?: string;
}

interface ZaiUserResponse {
  users: ZaiUser;
}

interface CreateZaiUserPayload {
  id: string; // Your internal user ID
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip?: string;
  country: string;
  dob?: string;
}

interface ZaiIdentityVerificationPayload {
  user_id: string;
  identity_type: "passport" | "driver_license";
  identity_number: string;
  expiry_date: string;
  place_of_issue: string;
  date_of_birth: string;
  full_name: string;
}

export class ZaiService {
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private readonly apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL:
        process.env.ZAI_API_BASE_URL || "https://test.api.promisepay.com",
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.apiClient.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.getValidAccessToken();
        if (config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        console.error("Zai API Error:", error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getValidAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      new Date() < this.tokenExpiresAt
    ) {
      return this.accessToken;
    }

    return await this.refreshAccessToken();
  }

  /**
   * Refresh the access token using OAuth2 client credentials flow
   */
  private async refreshAccessToken(): Promise<string> {
    try {
      if (!process.env.ZAI_AUTH_URL) {
        throw new Error("ZAI_AUTH_URL is not set");
      }
      if (!process.env.ZAI_CLIENT_ID) {
        throw new Error("ZAI_CLIENT_ID is not set");
      }
      if (!process.env.ZAI_CLIENT_SECRET) {
        throw new Error("ZAI_CLIENT_SECRET is not set");
      }
      const response = await axios.post<ZaiAuthResponse>(
        process.env.ZAI_AUTH_URL,
        {
          grant_type: "client_credentials",
          client_id: process.env.ZAI_CLIENT_ID,
          client_secret: process.env.ZAI_CLIENT_SECRET,
          scope: process.env.ZAI_SCOPE,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry time with 5-minute buffer
      this.tokenExpiresAt = new Date(
        Date.now() + (response.data.expires_in - 300) * 1000
      );

      return this.accessToken;
    } catch (error) {
      console.error("Failed to refresh Zai access token:", error);
      throw new Error("Unable to authenticate with Zai API");
    }
  }

  /**
   * Create a new user in Zai
   */
  async createUser(userData: CreateZaiUserPayload): Promise<ZaiUser> {
    try {
      const response = await this.apiClient.post<ZaiUserResponse>(
        "/users",
        userData
      );
      return response.data.users;
    } catch (error: any) {
      console.error("Failed to create Zai user:", error);

      // Log detailed error information for debugging
      if (error.response) {
        console.error("Zai API Error Details:");
        console.error("Status:", error.response.status);
        console.error("Data:", JSON.stringify(error.response.data, null, 2));
        console.error("Request Data:", JSON.stringify(userData, null, 2));
      }

      throw new Error("Failed to create user in Zai");
    }
  }

  /**
   * Get user details from Zai
   */
  async getUser(userId: string): Promise<ZaiUser> {
    try {
      const response = await this.apiClient.get<ZaiUserResponse>(
        `/users/${userId}`
      );
      return response.data.users;
    } catch (error) {
      console.error("Failed to get Zai user:", error);
      throw new Error("Failed to retrieve user from Zai");
    }
  }

  /**
   * Update user information in Zai
   */
  async updateUser(
    userId: string,
    userData: Partial<CreateZaiUserPayload>
  ): Promise<ZaiUser> {
    try {
      const response = await this.apiClient.patch<ZaiUserResponse>(
        `/users/${userId}`,
        userData
      );
      return response.data.users;
    } catch (error) {
      console.error("Failed to update Zai user:", error);
      throw new Error("Failed to update user in Zai");
    }
  }

  /**
   * TODO: This is not used yet.
   * Submit identity verification data to Zai
   */
  async submitIdentityVerification(
    verificationData: ZaiIdentityVerificationPayload
  ): Promise<any> {
    try {
      // Note: This endpoint may vary based on Zai's actual identity verification API
      // You'll need to check the exact endpoint in Zai's documentation
      const response = await this.apiClient.post(
        `/users/${verificationData.user_id}/identity`,
        {
          identity_type: verificationData.identity_type,
          identity_number: verificationData.identity_number,
          expiry_date: verificationData.expiry_date,
          place_of_issue: verificationData.place_of_issue,
          date_of_birth: verificationData.date_of_birth,
          full_name: verificationData.full_name,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Failed to submit identity verification to Zai:", error);
      throw new Error("Failed to submit identity verification");
    }
  }

  // TODO: This is only used for testing before production.
  async verifyUser(userId: string): Promise<any> {
    try {
      const response = await this.apiClient.patch(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to verify user:", error);
      throw new Error("Failed to verify user");
    }
  }

  /**
   * Get user's wallet accounts details.
   * A wallet is created by default when a user is created.
   */
  async getWalletBalance(userId: string): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `/users/${userId}/wallet_accounts`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get wallet balance:", error);
      throw new Error("Failed to retrieve wallet balance");
    }
  }

  async createVirtualAccount(walletId: string): Promise<any> {
    try {
      const response = await this.apiClient.post(
        `/wallet_accounts/${walletId}/virtual_accounts`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to create virtual account:", error);
      throw new Error("Failed to create virtual account");
    }
  }

  /**
   * Get wallet NPP details.
   */
  async getWalletNppDetails(walletId: string): Promise<any> {
    try {
      const response = await this.apiClient.get(
        `/wallet_accounts/${walletId}/npp_details`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to get wallet NPP details:", error);
      throw new Error("Failed to retrieve wallet NPP details");
    }
  }

  /**
   * Health check for Zai API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.apiClient.get("/health");
      return true;
    } catch (error) {
      console.error("Zai health check failed:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const zaiService = new ZaiService();
