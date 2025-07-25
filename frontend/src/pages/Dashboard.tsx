import { InboxArrowDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../services/firebaseFetch";
dayjs.extend(relativeTime);

import type {
  Card,
  ExpenseCategory,
  IncomeExpenseData,
  Transaction,
} from "../types";

const mockExpenseCategories: ExpenseCategory[] = [
  { name: "Friends", amount: "$950", color: "bg-indigo-500", percentage: 60 },
  { name: "Bills", amount: "$420", color: "bg-green-500", percentage: 25 },
  { name: "Other", amount: "$380", color: "bg-lime-500", percentage: 15 },
];

const mockIncomeExpenseData: IncomeExpenseData[] = [
  {
    type: "income",
    amount: "$2,240",
    period: "This week's income",
    change: "+12%",
    changeType: "positive",
  },
  {
    type: "expense",
    amount: "$1,750",
    period: "This week's expense",
    change: "+9%",
    changeType: "negative",
  },
];

// Utility functions for backend integration
const formatBalance = (balance: number, currency: string): string => {
  return balance.toLocaleString(undefined, {
    minimumFractionDigits: currency === "JPY" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  });
};

function Dashboard() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const navigate = useNavigate();
  // done
  const [cards, setCards] = useState<Card[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [transferAmount, setTransferAmount] = useState("");
  const [transferCurrency, setTransferCurrency] = useState("AUD");
  const [recipientUsername, setRecipientUsername] = useState("");

  // add all supported currencies to here, check correct
  // currency code
  const availableCurrencies = [
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  ];

  // to do
  const [expenseCategories] = useState<ExpenseCategory[]>(
    mockExpenseCategories
  );
  const [incomeExpenseData] = useState<IncomeExpenseData[]>(
    mockIncomeExpenseData
  );

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const goToCard = (index: number) => {
    setCurrentCardIndex(index);
  };

  // const [test,setTest] = useState([]);

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

  const fetchTransactions = async () => {
    const response = await authFetch(
      "http://localhost:4000/api/dashboard/transactions",
      {
        method: "GET",
      }
    );
    const data = await response.json();
    setTransactions(data.transactions);
  };

  // const audWallet = cards.find((card) => card.currency === "AUD");
  // const usdWallet = cards.find((card) => card.currency === "USD");
  // const hasUSDWallet = !!usdWallet;

  const userWallets = availableCurrencies
    .map((currency) => ({
      ...currency,
      wallet: cards.find((card) => card.currency === currency.code),
    }))
    .filter((item) => item.wallet);

  const getTransferWallet = () =>
    userWallets.find((w) => w.code === transferCurrency)?.wallet;
  const getTransferSymbol = () =>
    availableCurrencies.find((c) => c.code === transferCurrency)?.symbol || "";

  useEffect(() => {
    fetchCards();
    fetchTransactions();
  }, []);

  const transferMoney = async () => {
    const amount = parseFloat(transferAmount);

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!recipientUsername.trim()) {
      alert("Please enter a recipient username");
      return;
    }

    try {
      const response = await authFetch(
        "http://localhost:4000/api/dashboard/transfer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientUsername: recipientUsername.trim(),
            currencyCode: transferCurrency,
            amount: amount,
          }),
        }
      );

      if (response.ok) {
        await fetchCards(); // Refresh wallet balances
        setTransferAmount("");
        setRecipientUsername("");
        alert(
          `Successfully transferred ${getTransferSymbol()}${amount} to ${recipientUsername}!`
        );
      } else {
        const errorData = await response.json();
        alert(`Transfer failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error transferring money:", error);
      alert("Error transferring money. Please try again.");
    }
  };

  const addUSDWallet = async () => {
    try {
      const response = await authFetch(
        "http://localhost:4000/api/dashboard/wallet",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currencyCode: "USD" }),
        }
      );

      if (response.ok) {
        await fetchCards();
        alert("USD wallet created");
      } else {
        const errorData = await response.json();
        alert(`failed create wallet: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("err creating wallet:", error);
      alert("err creating wallet");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - Card and Transactions */}
        <div className="lg:col-span-3 space-y-6">
          {/* My Cards Carousel */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Cards</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {currentCardIndex + 1} of {cards.length}
                </span>
                <div className="flex space-x-1">
                  {cards.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToCard(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-200 hover:cursor-pointer ${
                        index === currentCardIndex
                          ? "bg-black w-6"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Card Container */}
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentCardIndex * 100}%)` }}
              >
                {cards.map((card, index) => (
                  <div key={card.id} className="w-full flex-shrink-0">
                    <div
                      className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-6 text-white relative overflow-hidden`}
                    >
                      {/* Card Background Pattern */}
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                        <div className="w-full h-full rounded-full border-2 border-white transform translate-x-8 -translate-y-8"></div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
                        <div className="w-full h-full rounded-full border-2 border-white transform -translate-x-4 translate-y-4"></div>
                      </div>

                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-8">
                        <span className="text-white text-opacity-90 font-medium">
                          {card.currency}
                        </span>
                      </div>

                      {/* Balance */}
                      <div className="mb-8">
                        <div className="text-sm text-white text-opacity-80 mb-2">
                          Total Balance
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold">
                          {card.symbol}
                          {formatBalance(card.balance, card.currency)}
                        </div>
                      </div>

                      {/* Card Details
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white text-opacity-90 text-sm font-mono tracking-wider">
                            {card.cardNumber}
                          </div>
                        </div>
                      </div> */}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons - Hidden on mobile, shown on larger screens */}
            <button
              onClick={prevCard}
              className="hidden sm:flex absolute left-0 top-[calc(50%+1rem)] transform -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center hover:shadow-xl transition-all z-10 hover:cursor-pointer hover:bg-gray-200"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={nextCard}
              className="hidden sm:flex absolute right-0 top-[calc(50%+1rem)] transform -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg items-center justify-center hover:shadow-xl transition-all z-10 hover:cursor-pointer hover:bg-gray-200"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Mobile Touch Navigation Hints */}
            <div className="sm:hidden flex gap-4 mt-4">
              <button
                onClick={prevCard}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-200 transition-all hover:cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextCard}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-200 transition-all hover:cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Send & Request Buttons - Mobile only (appears between cards and transactions) */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:hidden">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center space-x-3 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all hover:cursor-pointer">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span className="font-medium">Send Money</span>
              </button>
              <button
                onClick={() => navigate("/request-payment")}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all hover:cursor-pointer"
              >
                <InboxArrowDownIcon className="w-5 h-5" />
                <span className="font-medium">Request Money</span>
              </button>
              {/* <button
                onClick={addUSDWallet}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all hover:cursor-pointer"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="font-medium">Add USD Wallet</span>
              </button> */}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">
                Recent Transactions
              </h3>
              <button
                onClick={() => navigate("/Transactions")}
                className="text-sm text-gray-500 hover:text-black transition-colors hover:cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="space-y-4">
              {/* added slice to only show first 5 transactions */}
              {transactions.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No transactions yet
                </div>
              )}
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-12 h-12 ${transaction.color} rounded-xl flex items-center justify-center`}
                    >
                      <span className="text-lg">{transaction.icon}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900 block">
                        {transaction.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {dayjs(transaction.time).fromNow()}
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {parseFloat(transaction.amount) < 0
                      ? `-$${Math.abs(parseFloat(transaction.amount)).toFixed(
                          2
                        )}`
                      : `$${transaction.amount}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Charts and Analytics */}
        <div className="space-y-6 lg:col-span-2">
          {/* Send & Request Buttons - Desktop only */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hidden lg:block mt-11">
            <h3 className="font-semibold text-gray-900 mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center space-x-3 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all hover:cursor-pointer">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span className="font-medium">Send Money</span>
                {/* TODO: Add send money page */}
              </button>
              <button
                onClick={() => navigate("/request-payment")}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all hover:cursor-pointer"
              >
                <InboxArrowDownIcon className="w-5 h-5" />
                <span className="font-medium">Request Money</span>
                {/* TODO: Add request money page */}
              </button>
              <button
                className="w-full flex items-center justify-center space-x-3 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all hover:cursor-pointer"
                onClick={() => {
                  navigate("/add-money");
                }}
              >
                <PlusIcon className="w-5 h-5" />
                <span className="font-medium">Add Money</span>
              </button>
              {/* <button
                onClick={addUSDWallet}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all hover:cursor-pointer"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="font-medium">Add USD Wallet</span>
              </button> */}
            </div>
          </div>

          {/* Money Transfer */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Send Money</h3>
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </div>

            <div className="space-y-4">
              {/* Recipient Username */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  To Username
                </label>
                <input
                  type="text"
                  value={recipientUsername}
                  onChange={(e) => setRecipientUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Currency Selection */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Currency
                </label>
                <select
                  value={transferCurrency}
                  onChange={(e) => setTransferCurrency(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                >
                  {userWallets.map((wallet) => (
                    <option key={wallet.code} value={wallet.code}>
                      {wallet.code} - {wallet.name}
                    </option>
                  ))}
                </select>

                {/* Amount Input */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {getTransferSymbol()}
                  </span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Balance Display */}
                {getTransferWallet() && (
                  <p className="text-xs text-gray-500 mt-1">
                    Your Balance: {getTransferSymbol()}
                    {formatBalance(
                      getTransferWallet()!.balance,
                      transferCurrency
                    )}
                  </p>
                )}
              </div>

              {/* Transfer Button */}
              <button
                onClick={transferMoney}
                disabled={
                  !transferAmount ||
                  !recipientUsername.trim() ||
                  !getTransferWallet() ||
                  userWallets.length === 0
                }
                className="w-full flex items-center justify-center space-x-2 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span className="font-medium">
                  Send {getTransferSymbol()}
                  {transferAmount || "0"} to {recipientUsername || "user"}
                </span>
              </button>

              {userWallets.length === 0 && (
                <p className="text-xs text-red-500 text-center">
                  You need at least one wallet to transfer money
                </p>
              )}
            </div>
          </div>
          {/* Available Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                Expense Categories
              </h3>
              <button className="text-sm text-gray-500 hover:text-black hover:cursor-pointer">
                View All →
              </button>
            </div>

            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg
                className="w-24 h-24 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeDasharray="60, 100"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="25, 100"
                  strokeDashoffset="-60"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#84cc16"
                  strokeWidth="3"
                  strokeDasharray="15, 100"
                  strokeDashoffset="-85"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold">$1,750</span>
                <span className="text-xs text-gray-500">Total</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {expenseCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 ${category.color} rounded-full`}
                    ></div>
                    <span className="text-gray-600">{category.name}</span>
                  </div>
                  <span className="font-medium text-xs">{category.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Card
          {incomeExpenseData
            .filter((data) => data.type === "expense")
            .map((data, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {data.type}
                  </h3>
                </div>
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {data.amount}
                </div>
                <div className="text-sm text-gray-500 mb-4">{data.period}</div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                    data.changeType === "positive"
                      ? "bg-green-100 text-green-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {data.change}
                </div>
              </div>
            ))} */}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
