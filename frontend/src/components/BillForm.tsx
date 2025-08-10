import {
  BanknotesIcon,
  Cog8ToothIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { ConfirmModal } from "../components/ConfirmModal";
import { billPaymentSchema } from "../schema/billPaymentsSchema.schema";
import { authFetch } from "../services/firebaseFetch";
import type { BillInputs, Wallet } from "../types";
import { VITE_BACKEND_URL } from "../constants";

export function BillForm({
  handleActualSubmit,
  billData,
  isEditMode = false,
}: {
  handleActualSubmit: (validatedInputs: BillInputs) => void;
  billData?: BillInputs;
  isEditMode?: boolean;
}) {
  const backendUrl = VITE_BACKEND_URL;
  const [payMethod, setPayMethod] = useState<"bankAcct" | "bpay">(
    billData?.payMethod || "bankAcct"
  );
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [validatedInputs, setValidatedInputs] = useState<BillInputs | null>(
    null
  );
  // For control the reminder days, checkability and validity
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(
    billData?.type === "recurring"
  );
  const [isReminder, setIsReminder] = useState(!!billData?.reminder);

  // Calculate how many full days are left until the scheduled date.
  // If the date is invalid or in the past, the result is 0.
  // Reminder options are only shown if this value is > 0.
  const maxReminderDays = scheduledDate
    ? Math.max(
        0,
        Math.floor(
          (new Date(scheduledDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  useEffect(() => {
    if (billData?.nextRunAt) {
      setIsScheduled(true);
      setScheduledDate(billData.nextRunAt);
    }
  }, [billData]);

  // Fetch the wallet info
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const res = await authFetch(`${backendUrl}/api/bill-payments/wallets`);
        const data = await res.json();

        if (!res.ok) {
          setFieldErrors((prev) => ({
            ...prev,
            wallets: `Error ${res.status}: ${data.error}`,
          }));
          return;
        }

        if (Array.isArray(data) && data.length > 0) {
          setWallets(data);
        }
      } catch (err) {
        console.error("Network error", err);
        setFieldErrors((prev) => ({
          ...prev,
          wallets: "Something went wrong. Please try again later.",
        }));
      }
    };

    fetchWallets();
  }, [backendUrl]);

  const handleClickSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const originalFormData = new FormData(event.currentTarget);
    const rawObject = Object.fromEntries(originalFormData.entries());
    const parseResult = billPaymentSchema.safeParse(rawObject);
    if (!parseResult.success) {
      const issues = parseResult.error.issues;
      console.error("Validation errors", issues);

      const fieldErrors: Record<string, string> = {};

      for (const issue of issues) {
        // path[0]: the top level key, no nested values here
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }

      setFieldErrors(fieldErrors);
      return;
    }

    // Check the checkboxes:
    const inputs: BillInputs = {
      ...parseResult.data,
      type: "one-time",
    };
    if (isRecurring) {
      if (!rawObject["frequency"]) {
        setFieldErrors({
          ...fieldErrors,
          frequency: "Please select how often this payment should repeat.",
        });
        return;
      }
      inputs.type = "recurring";
      inputs.frequency = rawObject["frequency"].toString();
    }
    if (isScheduled) {
      if (!scheduledDate || new Date(scheduledDate.toString()) < new Date()) {
        setFieldErrors({
          ...fieldErrors,
          firstPaymentDate: "Please enter a valid date for the first payment.",
        });
        return;
      }
      inputs.firstPaymentDate = scheduledDate.toString();
    } else {
      delete inputs.firstPaymentDate;
    }

    if (isReminder) {
      if (!rawObject["reminderDays"] || Number(rawObject["reminderDays"]) < 1) {
        setFieldErrors({
          ...fieldErrors,
          reminderDays:
            "Please enter how many days in advance you'd like to be reminded.",
        });
        return;
      }
      inputs.reminder = true;
      inputs.reminderDays = rawObject["reminderDays"].toString();
    }
    setValidatedInputs(inputs);
    setShowModal(true);
    setFieldErrors({});
  };

  function removeFieldError(fieldName: string) {
    setFieldErrors((prev) => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-gray-900">Bill Payment</h1>
      <form
        className=" space-y-6 mt-5"
        aria-labelledby="bill-payment-form"
        onSubmit={handleClickSubmit}
      >
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-lg text-blue-800">
            <WalletIcon className="size-6 " /> Choose which wallet you'd like to
            pay from
          </h3>
          <select
            id="walletId"
            name="walletId"
            defaultValue={billData?.walletId}
            className="mt-3 block border px-2 py-1 rounded"
          >
            {wallets.map((wallet) => (
              <option key={wallet.walletId} value={wallet.walletId}>
                Balance: {wallet.currency} {wallet.balance}
              </option>
            ))}
          </select>
          {fieldErrors.walletId && (
            <p className="text-sm text-red-600">{fieldErrors.walletId}</p>
          )}
        </div>
        <label>
          <span className="font-medium">Amount</span>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            defaultValue={billData?.amount}
            className="block border px-2 py-1 w-full rounded mb-4"
            required
          />
        </label>
        {fieldErrors.amount && (
          <p className="text-sm text-red-600">{fieldErrors.amount}</p>
        )}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 font-semibold text-lg text-blue-800">
            <BanknotesIcon className="size-6" /> Where should the money go?
          </h3>
          <div className="mt-3 flex gap-4 font-medium">
            <label htmlFor="payMethod-bank" className="flex items-center gap-1">
              <input
                id="payMethod-bank"
                type="radio"
                name="payMethod"
                value="bankAcct"
                checked={payMethod === "bankAcct"}
                onChange={() => setPayMethod("bankAcct")}
              />
              Bank Account
            </label>
            <label htmlFor="payMethod-bpay" className="flex items-center gap-1">
              <input
                id="payMethod-bpay"
                type="radio"
                name="payMethod"
                value="bpay"
                checked={payMethod === "bpay"}
                onChange={() => setPayMethod("bpay")}
              />
              BPAY
            </label>
          </div>
        </div>
        {fieldErrors.payMethod && (
          <p className="text-sm text-red-600">{fieldErrors.payMethod}</p>
        )}
        {payMethod === "bankAcct" && (
          <div className="space-y-4 border p-4 rounded border-gray-300">
            <label>
              <span className="font-medium">Biller Account Number</span>
              <input
                name="billerBankAccountNumber"
                defaultValue={billData?.billerBankAccountNumber}
                className="block border px-2 py-1 w-full rounded"
                onChange={() => removeFieldError("billerBankAccountNumber")}
                required
              />
            </label>
            {fieldErrors.billerBankAccountNumber && (
              <p className="text-sm text-red-600">
                {fieldErrors.billerBankAccountNumber}
              </p>
            )}
            <label>
              <span className="font-medium">Biller BSB number</span>
              <input
                name="billerBsb"
                defaultValue={billData?.billerBsb}
                className="block border px-2 py-1 w-full rounded"
                onChange={() => removeFieldError("billerBsb")}
                required
              />
            </label>
            {fieldErrors.billerBsb && (
              <p className="text-sm text-red-600">{fieldErrors.billerBsb}</p>
            )}
            <label>
              <span className="font-medium">
                Who are you paying? (Optional)
              </span>

              <p className="text-sm text-gray-500 italic">
                Add a name to help you remember who this is.
              </p>
              <input
                maxLength={40}
                name="billerDisplayName"
                defaultValue={billData?.billerDisplayName}
                className="block border px-2 py-1 w-full rounded"
                placeholder="e.g. AGL Energy, Anna (Landlord)"
              />
            </label>
          </div>
        )}

        {payMethod === "bpay" && (
          <div className="space-y-4 border p-4 rounded border-gray-300">
            <label>
              <span className="font-medium">Biller code</span>
              <input
                name="billerBpayCode"
                defaultValue={billData?.billerBpayCode}
                className="block border px-2 py-1 w-full rounded"
                onChange={() => removeFieldError("billerBpayCode")}
                required
              />
            </label>
            {fieldErrors.billerBpayCode && (
              <p className="text-sm text-red-600">
                {fieldErrors.billerBpayCode}
              </p>
            )}
            <label>
              <span className="font-medium">Ref</span>
              <input
                maxLength={20}
                name="billerBpayRef"
                defaultValue={billData?.billerBpayRef}
                className="block border px-2 py-1 w-full rounded"
                required
              />
            </label>
            {fieldErrors.billerBpayRef && (
              <p className="text-sm text-red-600">
                {fieldErrors.billerBpayRef}
              </p>
            )}
            <label>
              <span className="font-medium">
                Who are you paying? (Optional)
              </span>

              <p className="text-sm text-gray-500 italic">
                Add a name to help you remember who this is.
              </p>
              <input
                maxLength={40}
                defaultValue={billData?.billerDisplayName}
                name="billerDisplayName"
                className="block border px-2 py-1 w-full rounded"
                placeholder="e.g. AGL Energy, Anna (Landlord)"
              />
            </label>
          </div>
        )}

        <label>
          <span className="font-medium">What is this for? (Optional)</span>
          <p className="text-sm text-gray-500 italic">
            Describe the payment purpose.
          </p>
          <input
            maxLength={40}
            name="billDisplayName"
            defaultValue={billData?.billDisplayName}
            className="block border px-2 py-1 w-full rounded"
            placeholder="e.g. Electricity, Internet Plan"
          />
        </label>

        <h3 className="flex items-center gap-2 font-semibold text-lg mt-6 text-blue-800">
          <Cog8ToothIcon className="size-6" />
          Payment Options (All optional)
        </h3>

        <div className="space-y-4 border p-4 rounded border-gray-300">
          {/* Schedule Payment */}
          <section className="flex items-start gap-2">
            <input
              type="checkbox"
              name="scheduleEnabled"
              className="mt-1"
              checked={isScheduled}
              onChange={(e) => {
                setIsScheduled(e.target.checked);
                if (!e.target.checked) setIsReminder(false);
              }}
            />
            <div>
              <label htmlFor="firstPaymentDate" className="font-medium">
                Schedule this payment
              </label>
              <p className="italic text-sm text-gray-500">
                Choose a date if you don’t want to send this payment right away.
              </p>
              {isScheduled && (
                <input
                  type="date"
                  name="firstPaymentDate"
                  defaultValue={formatDateToInput(billData?.nextRunAt)}
                  onChange={(e) => {
                    setScheduledDate(e.target.value);
                    removeFieldError("firstPaymentDate");
                  }}
                  className="mt-1 block border px-2 py-1 rounded"
                />
              )}

              {fieldErrors.firstPaymentDate && (
                <p className="text-sm text-red-600">
                  {fieldErrors.firstPaymentDate}
                </p>
              )}
            </div>
          </section>

          {/* Recurring */}
          <section className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              name="recurringEnabled"
              className="mt-1"
            />
            <div>
              <label className="font-medium">Repeat this payment</label>
              <p className="text-sm text-gray-500 italic">
                We'll automatically send this payment on a repeating schedule.
              </p>
              {isRecurring && (
                <select
                  defaultValue={billData?.frequency}
                  name="frequency"
                  className="mt-1 block border px-2 py-1 rounded"
                >
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              )}

              {fieldErrors.frequency && (
                <p className="text-sm text-red-600">{fieldErrors.frequency}</p>
              )}
            </div>
          </section>

          {/* Reminder */}
          {isScheduled &&
            scheduledDate &&
            isDateAfterToday(new Date(scheduledDate)) && (
              <section className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={isReminder}
                  onChange={(e) => setIsReminder(e.target.checked)}
                  name="reminderEnabled"
                  className="mt-1"
                />
                <div>
                  <label className="font-medium">Set a reminder</label>
                  <p className="italic text-sm text-gray-500">
                    We’ll notify you before the scheduled or recurring payment
                    is sent.
                  </p>
                  {isReminder && (
                    <div className="mt-1 flex items-center gap-2">
                      <label className="text-sm">Remind me</label>
                      <input
                        type="number"
                        defaultValue={billData?.reminderDays}
                        name="reminderDays"
                        min="1"
                        max={maxReminderDays}
                        className="w-16 border px-2 py-1 rounded"
                      />
                      <span className="text-sm">days before</span>
                    </div>
                  )}

                  {fieldErrors.reminderDays && (
                    <p className="text-sm text-red-600">
                      {fieldErrors.reminderDays}
                    </p>
                  )}
                </div>
              </section>
            )}
        </div>
        <div className="flex flex-row items-center gap-3">
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-6 rounded font-semibold hover:cursor-pointer w-32"
          >
            {isEditMode ? <>Save</> : <>Submit</>}
          </button>
          {Object.keys(fieldErrors).length > 0 && (
            <span className="text-sm text-red-600">
              There are some issues in the form. Please review and try again.
            </span>
          )}
        </div>
      </form>

      {showModal && (
        <ConfirmModal
          message={`Are you sure you want to ${
            isEditMode ? "update" : "create"
          } this bill?`}
          onConfirm={() => {
            setShowModal(false);
            if (validatedInputs) {
              handleActualSubmit(validatedInputs);
            }
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function formatDateToInput(dateString?: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toISOString().split("T")[0];
}

function isDateAfterToday(date: Date): boolean {
  const today = new Date();
  // just comparing the dates
  today.setHours(0, 0, 0, 0);
  const givenDate = new Date(date);
  givenDate.setHours(0, 0, 0, 0);
  return givenDate > today;
}
