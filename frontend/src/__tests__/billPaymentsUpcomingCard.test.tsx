import "@testing-library/jest-dom";
import { authFetch } from "../services/firebaseFetch";
import { UpcomingBillCard } from "../components/UpcomingBillCard";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { UpcomingBill } from "../types";

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

const mockCancelBillByIdFetchRes = () => {
  (authFetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => {},
  });
};

// mock ConfirmModal
jest.mock("../components/ConfirmModal", () => {
  return {
    ConfirmModal: ({
      message,
      onConfirm,
      onCancel,
    }: {
      message: string;
      onConfirm: () => void;
      onCancel: () => void;
    }) => (
      <div data-testid="modal">
        <div>{message}</div>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ),
  };
});

const mockBill: UpcomingBill = {
  billId: "1",
  type: "one-time",
  billDisplayName: "Electricity Bill",
  billerDisplayName: "AGL Energy",
  billerBsb: "123456",
  billerBankAccountNumber: "987654321",
  billerBpayCode: "12345",
  billerBpayRef: "9876543210",
  amount: "150.00",
  nextRunAt: "2025-10-15T00:00:00Z",
  currencyCode: "AUD",
};

describe("Upcoming bill card can cancel and edit the bill", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("can display a bill", () => {
    render(<UpcomingBillCard bill={mockBill} onCancelBill={jest.fn()} />);
    expect(screen.getByText(/one-time/i)).toBeInTheDocument();

    expect(screen.getByText(/Electricity Bill/i)).toBeInTheDocument();
    expect(screen.getByText(/Pay to:\s*AGL Energy/i)).toBeInTheDocument();
    expect(screen.getByText(/AUD\s*150\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/Paying on:\s*15 Oct 2025/i)).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });
  it("can cancel a bill by id", async () => {
    const onCancelBill = jest.fn();
    render(<UpcomingBillCard bill={mockBill} onCancelBill={onCancelBill} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(await screen.findByTestId("modal")).toBeInTheDocument();

    mockCancelBillByIdFetchRes();
    fireEvent.click(screen.getByText(/confirm/i));

    await waitFor(() => {
      expect(onCancelBill).toHaveBeenCalledWith("1");
    });
  });
  it("can edit a bill", () => {
    render(<UpcomingBillCard bill={mockBill} onCancelBill={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    // redirect to the editing page
    expect(mockNavigate).toHaveBeenCalledWith("/bill-payments/edit/1");
  });
});
