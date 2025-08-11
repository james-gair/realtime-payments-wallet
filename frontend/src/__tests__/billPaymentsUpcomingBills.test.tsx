import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authFetch } from "../services/firebaseFetch";
import { BillPayments } from "../pages/BillPayments";

jest.mock("../services/firebaseFetch", () => ({ authFetch: jest.fn() }));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(() => mockNavigate),
}));

// mock env
jest.mock("../constants", () => ({
  VITE_BACKEND_URL: "http://mock-backend",
}));

const mockUpcomingBills = [
  {
    billId: "1",
    type: "one-time",
    billDisplayName: "Electricity Bill",
    billerDisplayName: "AGL Energy",
    billerBsb: "123456",
    billerBankAccountNumber: "987654321",
    billerBpayCode: "12345",
    billerBpayRef: "9876543210",
    amount: "150.00",
    nextRunAt: "2025-08-15T00:00:00Z",
    currencyCode: "AUD",
  },
  {
    billId: "2",
    type: "recurring",
    billDisplayName: "Water Bill",
    billerDisplayName: "Sydney Water",
    billerBsb: "654321",
    billerBankAccountNumber: "123456789",
    billerBpayCode: "54321",
    billerBpayRef: "1234567890",
    amount: "75.50",
    nextRunAt: "2025-09-01T00:00:00Z",
    currencyCode: "AUD",
  },
  {
    billId: "3",
    type: "recurring",
    billDisplayName: "Internet Bill",
    billerDisplayName: "Telstra",
    billerBsb: undefined,
    billerBankAccountNumber: undefined,
    billerBpayCode: "67890",
    billerBpayRef: "9876543210",
    amount: "69.99",
    nextRunAt: "2025-08-20T00:00:00Z",
    currencyCode: "AUD",
  },
];

const mockCheckKycPassFetchRes = () => {
  (authFetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => {},
  });
};

const mockCheckKycFailFetchRes = () => {
  (authFetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({
      error: "KYC not verified",
      redirectTo: "/kyc",
    }),
  });
};

const mockUpcomingBillsFetchRes = (bills = mockUpcomingBills) => {
  (authFetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => bills,
  });
};

describe("The Bill payments main page", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("failed kyc verification and redirects the user", async () => {
    render(<BillPayments />);
    mockCheckKycFailFetchRes();

    await waitFor(() => screen.getByText(/Pay Bills/i));
    fireEvent.click(screen.getByText(/Pay Bills/i));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/kyc"));
  });
  it("passed kyc verification and go to pay bill form", async () => {
    render(<BillPayments />);
    mockCheckKycPassFetchRes();

    await waitFor(() => screen.getByText(/Pay Bills/i));
    fireEvent.click(screen.getByText(/Pay Bills/i));

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/bill-payments/paybill")
    );
  });
  it("shows the upcoming bills", async () => {
    mockUpcomingBillsFetchRes();
    render(<BillPayments />);
    expect(
      await screen.findByRole("button", { name: /pay bills/i })
    ).toBeInTheDocument();

    expect(await screen.findByText(/Electricity Bill/i)).toBeInTheDocument();
    expect(await screen.findByText(/Water Bill/i)).toBeInTheDocument();
    expect(await screen.findByText(/Internet Bill/i)).toBeInTheDocument();
  });
  it("shows empty list when no upcoming bills", async () => {
    mockUpcomingBillsFetchRes([]);
    render(<BillPayments />);
    expect(
      await screen.findByText(/You have no upcoming bills yet. 😊/i)
    ).toBeInTheDocument();
  });
});
