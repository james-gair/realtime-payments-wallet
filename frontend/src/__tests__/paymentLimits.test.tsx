import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authFetch } from "../services/firebaseFetch";
import PaymentLimits from "../pages/PaymentLimits";

jest.mock("../services/firebaseFetch", () => ({ authFetch: jest.fn() }));

// mock env
jest.mock("../constants", () => ({
  VITE_BACKEND_URL: "http://mock-backend",
}));

const walletLimits = {
  limits: [
    { walletId: "1", currency: "AUD", limit: 100 },
    { walletId: "2", currency: "USD", limit: 200 },
  ],
};

const mockWalletLimitsOnce = () => {
  (authFetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => walletLimits,
  });
};

const mockSavedResOnce = () => {
  (authFetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => {},
  });
};

// mock Modal
jest.mock("../components/Modal", () => {
  return {
    Modal: ({
      modalName,
      displayMessage,
      onClose,
    }: {
      modalName: string;
      displayMessage: string;
      onClose: () => void;
    }) => (
      <div data-testid="modal">
        <div>{modalName}</div>
        <div>{displayMessage}</div>
        <button onClick={onClose}>Close</button>
      </div>
    ),
  };
});

describe("PaymentLimits", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("can display the limits and save changes sucessfully", async () => {
    const user = userEvent.setup();
    mockWalletLimitsOnce();
    render(<PaymentLimits />);
    const audInput = await screen.findByDisplayValue("100");
    const usdInput = await screen.findByDisplayValue("200");

    // new values
    await user.clear(audInput);
    await user.type(audInput, "123");
    await user.clear(usdInput);
    await user.type(usdInput, "456");

    mockSavedResOnce();
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByTestId("modal")).toHaveTextContent(
      /your payment limits have been saved/i
    );

    // close modal, done
    await user.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() => {
      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });
  });
});
