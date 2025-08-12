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
    try {
      const response = await authFetch(
        "http://localhost:4000/api/dashboard/wallet",
        {
          method: "GET",
        }
      );
      const data = await response.json();
      setCards(data.wallets || []);
    } catch (error) {
      console.error("Error fetching cards:", error);
      setCards([]);
    }
  };

  const availableCurrencies = [
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ];

  // // Show all currencies regardless of wallet ownership
  // const userWallets = availableCurrencies.map((currency) => ({
  //   ...currency,
  //   wallet: cards.find((card) => card.currency === currency.code),
  // }));

  const getFromWallet = () =>
    cards.find((card) => card.currency === fromCurrency);
  const getToWallet = () =>
    cards.find((card) => card.currency === toCurrency);
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

    if (!getFromWallet()) {
      alert(`You need a ${fromCurrency} wallet to exchange from this currency`);
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
            fromCurrencyCode: fromCurrency,
            toCurrencyCode: toCurrency,
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

    // Fetch cards and rates when component mounts
    fetchCards();
    fetchRates();
    
    // Refresh rates every 10 seconds
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md">
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
              {availableCurrencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
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

            {getFromWallet() ? (
              <p className="text-xs text-gray-500 mt-1">
                Balance: {getFromSymbol()}
                {formatBalance(getFromWallet()!.balance, fromCurrency)}
              </p>
            ) : (
              <p className="text-xs text-red-500 mt-1">
                No {fromCurrency} wallet found
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
              {availableCurrencies
                .filter((currency) => currency.code !== fromCurrency)
                .map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
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

            {getToWallet() ? (
              <p className="text-xs text-gray-500 mt-1">
                Balance: {getToSymbol()}
                {formatBalance(getToWallet()!.balance, toCurrency)}
              </p>
            ) : (
              <p className="text-xs text-orange-500 mt-1">
                {toCurrency} wallet will be created if needed
              </p>
            )}
          </div>

          <button
            onClick={exchangeCurrency}
            disabled={
              !exchangeAmount ||
              !getFromWallet() ||
              fromCurrency === toCurrency
            }
            className="w-full flex items-center justify-center space-x-2 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
            <span className="font-medium">
              Exchange {fromCurrency} → {toCurrency}
            </span>
          </button>

          {/* Helpful Messages */}
          <div className="space-y-1">
            {!getFromWallet() && (
              <p className="text-xs text-red-500 text-center">
                You need a {fromCurrency} wallet to exchange from this currency
              </p>
            )}
            
            {fromCurrency === toCurrency && (
              <p className="text-xs text-red-500 text-center">
                Please select different currencies
              </p>
            )}

            {!exchangeAmount && (
              <p className="text-xs text-gray-500 text-center">
                Enter an amount to exchange
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Forex;