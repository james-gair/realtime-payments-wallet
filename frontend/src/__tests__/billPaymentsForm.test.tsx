import "@testing-library/jest-dom";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { BillForm } from "../components/BillForm";
import { authFetch } from "../services/firebaseFetch";
import userEvent from "@testing-library/user-event";

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

const mockWalletsOnce = () => {
  (authFetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { walletId: "1", currency: "AUD", balance: 100.5 },
      { walletId: "2", currency: "USD", balance: 200.5 },
    ],
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
      <div id="modal">
        <div>{message}</div>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ),
  };
});

const renderForm = (props?: Partial<React.ComponentProps<typeof BillForm>>) => {
  const handleActualSubmit = jest.fn();
  render(<BillForm handleActualSubmit={handleActualSubmit} {...props} />);
  return { handleActualSubmit };
};

const fakeBillerBankAccountNumber = "3423423424";
const fakeBillerBSB = "432434";

const fakeBpayCode = "3423423";
const fakeBpayRef = "fdfsd";

const fakeBillerNickName = "AGL";
const fakeBillName = "Electricity";

describe("Bill form submission", () => {
  beforeEach(() => {
    mockWalletsOnce();
  });
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it("submits Bank Account bill payments immediate payment successfully", async () => {
    const user = userEvent.setup();
    const { handleActualSubmit } = renderForm();

    await waitFor(() => expect(getWalletSelect()).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0)
    );

    await user.type(getAmountInput(), "43.2");
    expect(getBankAcctRadio()).toBeChecked();
    await user.type(getBillerAccountNumber(), fakeBillerBankAccountNumber);
    await user.type(getBillerBsb(), fakeBillerBSB);

    await user.click(getSubmitButton());
    await user.click(getConfirmButton());

    await waitFor(() => {
      expect(handleActualSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: "1",
          payMethod: "bankAcct",
          billerBankAccountNumber: fakeBillerBankAccountNumber,
          billerBsb: fakeBillerBSB,
          type: "one-time",
        })
      );
    });
  });
  it("submits BPAY bill payments immediate payment successfully", async () => {
    const user = userEvent.setup();
    const { handleActualSubmit } = renderForm();

    await waitFor(() => expect(getWalletSelect()).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0)
    );
    await user.selectOptions(getWalletSelect() as HTMLSelectElement, "2");

    await user.type(getAmountInput(), "43.2");
    await user.click(getBpayRadio());
    expect(getBpayRadio()).toBeChecked();

    await user.type(getBillerCode(), fakeBpayCode);
    await user.type(getBillerRef(), fakeBpayRef);

    await user.click(getSubmitButton());
    await user.click(getConfirmButton());

    await waitFor(() => {
      expect(handleActualSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: "2",
          payMethod: "bpay",
          billerBpayCode: fakeBpayCode,
          billerBpayRef: fakeBpayRef,
          type: "one-time",
        })
      );
    });
  });
  it("submits scheduled Bank Account payment successfully", async () => {
    const user = userEvent.setup();
    const { handleActualSubmit } = renderForm();

    await waitFor(() => expect(getWalletSelect()).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0)
    );

    await user.type(getAmountInput(), "43.2");
    expect(getBankAcctRadio()).toBeChecked();
    await user.type(getBillerAccountNumber(), fakeBillerBankAccountNumber);
    await user.type(getBillerBsb(), fakeBillerBSB);

    // for scheduled date
    await user.click(getScheduleCheckbox());
    const future = getAfutureDateStr();
    fireEvent.change(getFirstPaymentDate(), { target: { value: future } });

    await user.click(getSubmitButton());
    await user.click(getConfirmButton());

    await waitFor(() => {
      expect(handleActualSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          walletId: "1",
          payMethod: "bankAcct",
          billerBankAccountNumber: fakeBillerBankAccountNumber,
          billerBsb: fakeBillerBSB,
          type: "one-time",
        })
      );
    });
  });
  it("submit recurring and schedule with reminder Bank Account payment successfully", async () => {
    const user = userEvent.setup();
    const { handleActualSubmit } = renderForm();

    await waitFor(() => expect(getWalletSelect()).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0)
    );

    await user.type(getAmountInput(), "43.2");
    expect(getBankAcctRadio()).toBeChecked();
    await user.type(getBillerAccountNumber(), fakeBillerBankAccountNumber);
    await user.type(getBillerBsb(), fakeBillerBSB);

    // for scheduled date
    await user.click(getScheduleCheckbox());
    const future = getAfutureDateStr();
    fireEvent.change(getFirstPaymentDate(), { target: { value: future } });

    // recurring
    await user.click(getRecurringCheckbox());
    await waitFor(() => expect(getFrequencySelect()).toBeInTheDocument());
    await user.selectOptions(getFrequencySelect(), "monthly");

    // reminder days
    // the scheduled payment checkbox is ticked, this one should be in the doc already
    await waitFor(() => expect(getReminderCheckbox()).toBeInTheDocument());
    await user.click(getReminderCheckbox());
    await user.type(getReminderDaysInput(), "2");

    await user.type(getBillerDisplayName(), fakeBillerNickName);
    await user.type(getBillDisplayName(), fakeBillName);

    await user.click(getSubmitButton());
    await user.click(getConfirmButton());

    await waitFor(() => {
      expect(handleActualSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 43.2,
          billDisplayName: fakeBillName,
          billerBankAccountNumber: fakeBillerBankAccountNumber,
          billerBsb: fakeBillerBSB,
          billerDisplayName: fakeBillerNickName,
          firstPaymentDate: getAfutureDateStr(),
          frequency: "monthly",
          payMethod: "bankAcct",
          reminder: true,
          reminderDays: "2",
          type: "recurring",
          walletId: "1",
        })
      );
    });
  });
  it("does not allow time travel behavior trying to set a shcedule date in the past", async () => {
    const user = userEvent.setup();
    const { handleActualSubmit } = renderForm();

    await waitFor(() => expect(getWalletSelect()).toBeInTheDocument());
    await waitFor(() =>
      expect(screen.getAllByRole("option").length).toBeGreaterThan(0)
    );

    await user.type(getAmountInput(), "43.2");
    expect(getBankAcctRadio()).toBeChecked();
    await user.type(getBillerAccountNumber(), fakeBillerBankAccountNumber);
    await user.type(getBillerBsb(), fakeBillerBSB);

    // for scheduled date
    await user.click(getScheduleCheckbox());
    const past = getAPastDateStr();
    fireEvent.change(getFirstPaymentDate(), { target: { value: past } });

    // reminder days
    // when past date is entered, we could not even see the reminder days
    await waitFor(() => expect(getReminderCheckbox()).not.toBeInTheDocument());

    await user.click(getSubmitButton());

    // error shows up
    await screen.findByText(/please enter a valid date for the first payment/i);

    // we can't see the confimation modal
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // try to submit it
    expect(handleActualSubmit).not.toHaveBeenCalled();

    // can only see the red text
    expect(
      screen.getByText(/there are some issues in the form/i)
    ).toBeInTheDocument();
  });
});

////////////////
// query helpers:
/////////////////

const getWalletSelect = () => document.getElementById("walletId");

// amount
const getAmountInput = () => screen.getByLabelText(/amount/i);

// pay method fields
const getBankAcctRadio = () =>
  screen.getByRole("radio", { name: /bank account/i });
const getBpayRadio = () => screen.getByRole("radio", { name: /bpay/i });

// bank fields
const getBillerAccountNumber = () =>
  screen.getByLabelText(/biller account number/i);
const getBillerBsb = () => screen.getByLabelText(/biller bsb/i);

// BPAY fields
const getBillerCode = () => screen.getByLabelText(/biller code/i);
const getBillerRef = () => screen.getByLabelText(/^ref$/i);

// Optional naming
const getBillerDisplayName = () => screen.getByLabelText(/who are you paying/i);
const getBillDisplayName = () => screen.getByLabelText(/what is this for/i);

// // optional settings checkboxes
const getScheduleCheckbox = () =>
  document.querySelector('input[name="scheduleEnabled"]') as HTMLInputElement;
const getRecurringCheckbox = () =>
  document.querySelector('input[name="recurringEnabled"]') as HTMLInputElement;
const getReminderCheckbox = () =>
  document.querySelector('input[name="reminderEnabled"]') as HTMLInputElement;

// ootional settings inputs
const getFirstPaymentDate = () =>
  document.querySelector('input[name="firstPaymentDate"]') as HTMLInputElement;
const getFrequencySelect = () =>
  document.querySelector('select[name="frequency"]') as HTMLSelectElement;
const getReminderDaysInput = () =>
  document.querySelector('input[name="reminderDays"]') as HTMLInputElement;

// button
const getSubmitButton = () =>
  screen.getByRole("button", { name: /^(submit|save)$/i });

// confirmation modal
const getConfirmButton = () => screen.getByRole("button", { name: /confirm/i });

function getAfutureDateStr(days = 7) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getAPastDateStr(days = 7) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}
