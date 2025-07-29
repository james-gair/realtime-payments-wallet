import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { authFetch } from "../services/firebaseFetch";
import type { Card, Rates } from "../types";

function Forex() {
  const [rates, setRates] = useState<Rates>({});
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [exchangeAmount, setExchangeAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("AUD");
  const [toCurrency, setToCurrency] = useState("USD");
  const [cards, setCards] = useState<Card[]>([]);

  const formatBalance = (balance: number, currency: string): string => {
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: currency === "JPY" ? 0 : 2,
      maximumFractionDigits: currency === "JPY" ? 0 : 2,
    });
  };

  const fetchCards = async () => {
    const response = await authFetch(
      "http://localhost:4000/api/dashboard/wallet",
      {
        method: "GET",
      }
    );
    const data = await response.json();
    if (data.wallets.length === 0) {
      // if no wallets, create a default one
      setCards([
        {
          id: 1,
          currency: "AUD",
          balance: 0,
          gradient: "from-emerald-400 to-emerald-600",
          symbol: "A$",
        },
      ]);
    } else {
      setCards(data.wallets);
    }
  };

  const availableCurrencies = [
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ];

  const userWallets = availableCurrencies
    .map((currency) => ({
      ...currency,
      wallet: cards.find((card) => card.currency === currency.code),
    }))
    .filter((item) => item.wallet);

  const getFromWallet = () =>
    userWallets.find((w) => w.code === fromCurrency)?.wallet;
  const getToWallet = () =>
    userWallets.find((w) => w.code === toCurrency)?.wallet;
  const getFromSymbol = () =>
    availableCurrencies.find((c) => c.code === fromCurrency)?.symbol || "";
  const getToSymbol = () =>
    availableCurrencies.find((c) => c.code === toCurrency)?.symbol || "";

  const exchangeCurrency = async () => {
    const amount = parseFloat(exchangeAmount);

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (fromCurrency === toCurrency) {
      alert("Please select different currencies");
      return;
    }

    try {
      const response = await authFetch(
        "http://localhost:4000/api/dashboard/exchange",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromCurrencyCode: fromCurrency, // Dynamic instead of "AUD"
            toCurrencyCode: toCurrency, // Dynamic instead of "USD"
            fromAmount: amount,
          }),
        }
      );

      if (response.ok) {
        await fetchCards();
        setExchangeAmount("");
        alert(
          `Successfully exchanged ${getFromSymbol()}${amount} to ${toCurrency}!`
        );
      } else {
        const errorData = await response.json();
        alert(`Exchange failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error exchanging currency:", error);
      alert("Error exchanging currency. Please try again.");
    }
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await authFetch("http://localhost:4000/api/fx-rates", {
          method: "GET",
        });

        const data = await res.json();
        setRates(data.rates);
        setLastUpdated(data.lastUpdated || "");
      } catch (error) {
        console.error("Failed to fetch FX rates", error);
      }
    };

    // call when page gets rendered, refresh every 10 seconds
    fetchRates();
    const interval = setInterval(fetchRates, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sm:flex sm:space-x-8 space-y-8 sm:space-y-0">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Forex Rates</h1>
        <p className="text-sm text-gray-500">Base currency: AUD</p>
        <p className="text-xs text-gray-400">Last updated: {lastUpdated}</p>

        <div className="bg-white rounded-xl shadow p-6 max-w-md w-full">
          {Object.entries(rates).length === 0 ? (
            <p className="text-gray-500">Loading rates...</p>
          ) : (
            <ul className="space-y-3">
              {Object.entries(rates).map(([currency, rate]) => (
                <li
                  key={currency}
                  className="flex justify-between text-lg font-medium text-gray-700 border-b pb-2 last:border-b-0"
                >
                  <span>{currency}</span>
                  <span>{rate.toFixed(4)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Currency Exchange */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Currency Exchange</h3>
          <ArrowsRightLeftIcon className="w-5 h-5 text-gray-500" />
        </div>

        <div className="space-y-4">
          {/* From Currency */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">From</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
            >
              {userWallets.map((wallet) => (
                <option key={wallet.code} value={wallet.code}>
                  {wallet.code} - {wallet.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {getFromSymbol()}
              </span>
              <input
                type="number"
                value={exchangeAmount}
                onChange={(e) => setExchangeAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            {getFromWallet() && (
              <p className="text-xs text-gray-500 mt-1">
                Balance: {getFromSymbol()}
                {formatBalance(getFromWallet()!.balance, fromCurrency)}
              </p>
            )}
          </div>

          <div className="text-center text-sm text-gray-500">
            <ArrowsRightLeftIcon className="w-4 h-4 mx-auto mb-1" />
            Exchange Rate: Calculated by server
          </div>

          {/* To Currency */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">To</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
            >
              {userWallets
                .filter((wallet) => wallet.code !== fromCurrency)
                .map((wallet) => (
                  <option key={wallet.code} value={wallet.code}>
                    {wallet.code} - {wallet.name}
                  </option>
                ))}
            </select>

            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {getToSymbol()}
              </span>
              <input
                type="text"
                value="Amount calculated by server"
                readOnly
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            {getToWallet() && (
              <p className="text-xs text-gray-500 mt-1">
                Balance: {getToSymbol()}
                {formatBalance(getToWallet()!.balance, toCurrency)}
              </p>
            )}
          </div>

          <button
            onClick={exchangeCurrency}
            disabled={
              !exchangeAmount ||
              !getFromWallet() ||
              !getToWallet() ||
              fromCurrency === toCurrency ||
              userWallets.length < 2
            }
            className="w-full flex items-center justify-center space-x-2 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
            <span className="font-medium">
              Exchange {fromCurrency} → {toCurrency}
            </span>
          </button>

          {userWallets.length < 2 && (
            <p className="text-xs text-red-500 text-center">
              You need at least 2 different currency wallets to exchange
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Forex;
