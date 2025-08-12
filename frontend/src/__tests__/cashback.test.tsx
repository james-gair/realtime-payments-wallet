import { render, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Cashback from "../pages/CashBack";

jest.mock("../services/firebaseFetch", () => ({
  authFetch: jest.fn(),
}));

import { authFetch } from "../services/firebaseFetch";

// helpers
const mockOk = (data: any) => ({ ok: true, json: () => Promise.resolve(data) });
const mockErr = (msg: string) => ({ ok: false, json: () => Promise.resolve({ error: msg }) });

const wallets = [
  { currency: "AUD", balance: 25 },
  { currency: "USD", balance: 5 },
];

describe("Cashback page", () => {
  const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy.mockClear();
  });

  it("loads wallets on mount, preselects first currency, and shows balances", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets }));

    render(<Cashback />);

    // select is rendered immediately but value updates after fetchCards
    const currencySelect = await screen.findByLabelText(/select currency/i);
    await waitFor(() => expect(currencySelect).toHaveValue("AUD"));

    // available balance text appears for selected wallet
    expect(screen.getByText(/available balance:\s*25/i)).toBeInTheDocument();

    // wallet cards render
    expect(screen.getByText("AUD")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();

    // initial GET called
    expect(authFetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/dashboard/wallet",
      { method: "GET" }
    );
  });

  it("disables submit and shows warning when amount exceeds selected wallet balance", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets }));

    render(<Cashback />);

    const currencySelect = await screen.findByLabelText(/select currency/i);
    await waitFor(() => expect(currencySelect).toHaveValue("AUD"));

    // switch to USD balance = 5
    await user.selectOptions(currencySelect, "USD");

    const amount = screen.getByLabelText(/amount/i);
    await user.clear(amount);
    await user.type(amount, "10");

    const button = screen.getByRole("button", { name: /send money/i });
    expect(button).toBeDisabled();

    expect(
      screen.getByText(/insufficient balance\. you only have 5 USD/i)
    ).toBeInTheDocument();
  });

  it("validates required fields and positive amount", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets }));

    render(<Cashback />);

    // disable native validation, triggers custom alerts
    const formEl = document.querySelector("form") as HTMLFormElement;
    formEl.noValidate = true;

    const submit = await screen.findByRole("button", { name: /send money/i });

    // should hit custom 'Please fill in all fields'
    await user.click(submit);
    expect(window.alert).toHaveBeenCalledWith("Please fill in all fields");

    // should hit positive amount alert
    const recipient = screen.getByLabelText(/recipient username/i);
    await user.type(recipient, "nouser");

    const amount = screen.getByLabelText(/amount/i);
    await user.clear(amount);
    await user.type(amount, "0");

    await user.click(submit);
    expect(window.alert).toHaveBeenCalledWith("Please enter a positive amount");
  });

  it("submits successfully, alerts success, resets form, and refetches wallets", async () => {
    // 1) initial GET wallets
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets }));
    // 2) POST send-money
    (authFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    // 3) GET wallets again after success
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets }));

    render(<Cashback />);

    const recipient = await screen.findByLabelText(/recipient username/i);
    const amount = screen.getByLabelText(/amount/i);
    await user.type(recipient, "nouser");
    await user.clear(amount);
    await user.type(amount, "10");

    const submit = screen.getByRole("button", { name: /send money/i });
    await user.click(submit);

    // POST called with correct payload
    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        "http://localhost:4000/api/send-money",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            recipientUsername: "nouser",
            currencyCode: "AUD",
            amount: 10,
          }),
        })
      );
    });

    // success alert
    expect(window.alert).toHaveBeenCalledWith(
      "Transfer successful! Sent 10 AUD to nouser"
    );

    // recipient + amount cleared, currency remains first wallet
    expect((recipient as HTMLInputElement).value).toBe("");
    expect((amount as HTMLInputElement).value).toBe("");
    const currencySelect = screen.getByLabelText(/select currency/i) as HTMLSelectElement;
    expect(currencySelect.value).toBe("AUD");

    // refetch called
    expect(authFetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/dashboard/wallet",
      { method: "GET" }
    );
    // total calls: 3
    expect((authFetch as jest.Mock).mock.calls.length).toBe(3);
  });

  it("shows backend error when POST returns ok:false with error body", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce(mockOk({ wallets })); // initial GET
    (authFetch as jest.Mock).mockResolvedValueOnce(
      mockErr("Transfer failed due to server error")
    ); // POST error

    render(<Cashback />);

    const recipient = await screen.findByLabelText(/recipient username/i);
    const amount = screen.getByLabelText(/amount/i);
    await user.type(recipient, "nouser");
    await user.clear(amount);
    await user.type(amount, "10");

    await user.click(screen.getByRole("button", { name: /send money/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Transfer failed due to server error");
    });
  });
});
