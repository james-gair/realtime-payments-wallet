import { render, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Forex from "../pages/Forex";

jest.mock("../services/firebaseFetch", () => ({
  authFetch: jest.fn(),
}));

import { authFetch } from "../services/firebaseFetch";

// helpers
const mockOk = (data: any) => ({ ok: true, json: () => Promise.resolve(data) });
const mockErr = (msg: string) => ({ ok: false, json: () => Promise.resolve({ error: msg }) });

const wallets = [
  { currency: "AUD", balance: 100 },
  { currency: "USD", balance: 50 },
  // 2 is enough for testing
];

const rates = {
  USD: 0.6501,
  JPY: 110.1234,
};

describe("Forex page", () => {
  const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
  });

  it("loads wallets and rates on mount, shows last updated and rates list", async () => {
    // 1) GET wallets, 2) GET fx rates
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets }));
    (authFetch as jest.Mock).mockResolvedValueOnce(
      mockOk({ rates, lastUpdated: "2025-08-12T10:00:00Z" })
    );

    render(<Forex />);

    // rates initially show loading
    expect(screen.getByText(/loading rates/i)).toBeInTheDocument();

    // after fetch, rates list appears
    await waitFor(() => {
      expect(screen.getByText("USD")).toBeInTheDocument();
      expect(screen.getByText("JPY")).toBeInTheDocument();
      // exact formatting: toFixed(4)
      expect(screen.getByText("0.6501")).toBeInTheDocument();
      expect(screen.getByText("110.1234")).toBeInTheDocument();
    });

    expect(screen.getByText(/last updated:/i)).toBeInTheDocument();

    // msg for empty amount
    expect(screen.getByText(/enter an amount to exchange/i)).toBeInTheDocument();

    // called both endpoints on mount
    expect(authFetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:4000/api/dashboard/wallet",
      { method: "GET" }
    );
    expect(authFetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:4000/api/fx-rates",
      { method: "GET" }
    );
  });

  it("disables exchange if there is no amount and shows helpful message; shows missing wallet message for JPY", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets })); // GET wallets
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ rates })); // GET rates

    render(<Forex />);

    const selects = await screen.findAllByRole("combobox");
    const fromSelect = selects[0];
    const toSelect = selects[1];

    // button disabled initially
    const button = screen.getByRole("button", { name: /exchange/i });
    expect(button).toBeDisabled();
    expect(screen.getByText(/enter an amount to exchange/i)).toBeInTheDocument();

    // should show "No JPY wallet found" and keep disabled
    await user.selectOptions(fromSelect, "JPY");
    expect(screen.getByText(/no JPY wallet found/i)).toBeInTheDocument();

    // select should not contain JPY option
    // switch back to enable later tests !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    await user.selectOptions(fromSelect, "AUD");
    await user.selectOptions(toSelect, "USD");
  });

  it("validates amount = 0 triggers alert", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets })); // GET wallets
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ rates })); // GET rates

    render(<Forex />);

    const selects = await screen.findAllByRole("combobox");
    const fromSelect = selects[0];
    const toSelect = selects[1];

    // ensure From has a wallet and From != To
    await user.selectOptions(fromSelect, "AUD");
    await user.selectOptions(toSelect, "USD");

    const amountInput = screen.getByPlaceholderText("0.00");
    await user.clear(amountInput);
    await user.type(amountInput, "0");

    const button = screen.getByRole("button", { name: /exchange/i });
    expect(button).toBeEnabled();

    await user.click(button);
    expect(window.alert).toHaveBeenCalledWith("Please enter a valid amount");
  });

  it("successful exchange posts payload, refetches wallets, resets amount, and shows success alert", async () => {
    // 1) initial GET wallets
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets }));
    // 2) initial GET rates
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ rates }));
    // 3) POST /exchange ok:true
    (authFetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    // 4) refetch GET wallets after success
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets }));

    render(<Forex />);

    const selects = await screen.findAllByRole("combobox");
    const fromSelect = selects[0];
    const toSelect = selects[1];

    // AUD to USD with amount 25
    await user.selectOptions(fromSelect, "AUD");
    await user.selectOptions(toSelect, "USD");

    const amountInput = screen.getByPlaceholderText("0.00") as HTMLInputElement;
    await user.clear(amountInput);
    await user.type(amountInput, "25");

    const button = screen.getByRole("button", { name: /exchange/i });
    await user.click(button);

    // POST called with correct payload
    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/dashboard/exchange",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            fromCurrencyCode: "AUD",
            toCurrencyCode: "USD",
            fromAmount: 25,
          }),
        })
      );
    });

    // success alert uses currency symbol
    expect(window.alert).toHaveBeenCalledWith("Successfully exchanged A$25 to USD!");

    // amount reset
    expect(amountInput.value).toBe("");

    // refetch wallets after success
    expect(authFetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/dashboard/wallet",
      { method: "GET" }
    );
  });

  it("shows backend error message when exchange returns ok:false", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets })); // GET wallets
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ rates })); // GET rates
    (authFetch as jest.Mock).mockResolvedValueOnce(
      mockErr("Daily limit exceeded")
    ); // POST exchange returns error

    render(<Forex />);

    const selects = await screen.findAllByRole("combobox");
    const fromSelect = selects[0];
    const toSelect = selects[1];

    await user.selectOptions(fromSelect, "AUD");
    await user.selectOptions(toSelect, "USD");

    const amountInput = screen.getByPlaceholderText("0.00");
    await user.clear(amountInput);
    await user.type(amountInput, "10");

    const button = screen.getByRole("button", { name: /exchange/i });
    await user.click(button);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Exchange failed: Daily limit exceeded");
    });
  });
});
