import { useState } from "react";

// TypeScript interfaces for backend integration
interface Card {
  id: number;
  currency: string;
  balance: number;
  cardNumber: string;
  expiryDate: string;
  gradient: string;
  symbol: string;
}

interface Transaction {
  id: number;
  name: string;
  amount: string;
  icon: string;
  color: string;
  time: string;
  category?: string;
}

interface ExpenseCategory {
  name: string;
  amount: string;
  color: string;
  percentage: number;
}

interface IncomeExpenseData {
  type: "income" | "expense";
  amount: string;
  period: string;
  change: string;
  changeType: "positive" | "negative";
}

// Mock data - replace with API calls
const mockCards: Card[] = [
  {
    id: 1,
    currency: "USD",
    balance: 22350.5,
    cardNumber: "4358 4445 0968 2323",
    expiryDate: "08/24",
    gradient: "from-emerald-400 to-emerald-600",
    symbol: "$",
  },
  {
    id: 2,
    currency: "AUD",
    balance: 31245.75,
    cardNumber: "5234 6789 1234 5678",
    expiryDate: "12/25",
    gradient: "from-blue-400 to-blue-600",
    symbol: "A$",
  },
  {
    id: 3,
    currency: "YEN",
    balance: 2450000,
    cardNumber: "6789 1234 5678 9012",
    expiryDate: "03/26",
    gradient: "from-purple-400 to-purple-600",
    symbol: "¥",
  },
];

const mockTransactions: Transaction[] = [
  {
    id: 1,
    name: "Figma",
    amount: "-$ 15.00",
    icon: "🎨",
    color: "bg-orange-100",
    time: "2 hours ago",
    category: "Software",
  },
  {
    id: 2,
    name: "Grammarly",
    amount: "-$ 10.00",
    icon: "✍️",
    color: "bg-green-100",
    time: "1 day ago",
    category: "Software",
  },
  {
    id: 3,
    name: "Blender",
    amount: "-$ 15.00",
    icon: "🔷",
    color: "bg-orange-100",
    time: "2 days ago",
    category: "Software",
  },
  {
    id: 4,
    name: "Netflix",
    amount: "-$ 12.99",
    icon: "🎬",
    color: "bg-red-100",
    time: "3 days ago",
    category: "Entertainment",
  },
  {
    id: 5,
    name: "Spotify",
    amount: "-$ 9.99",
    icon: "🎵",
    color: "bg-green-100",
    time: "1 week ago",
    category: "Entertainment",
  },
];

const mockExpenseCategories: ExpenseCategory[] = [
  { name: "Food", amount: "$950", color: "bg-indigo-500", percentage: 60 },
  { name: "Clothes", amount: "$420", color: "bg-green-500", percentage: 25 },
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
    minimumFractionDigits: currency === "YEN" ? 0 : 2,
    maximumFractionDigits: currency === "YEN" ? 0 : 2,
  });
};

function Dashboard() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const [cards] = useState<Card[]>(mockCards);
  const [transactions] = useState<Transaction[]>(mockTransactions);
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

                      {/* Card Details */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white text-opacity-90 text-sm font-mono tracking-wider">
                            {card.cardNumber}
                          </div>
                        </div>
                      </div>
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

          {/* Transactions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">
                Recent Transactions
              </h3>
              <button className="text-sm text-gray-500 hover:text-black transition-colors hover:cursor-pointer">
                View All →
              </button>
            </div>

            <div className="space-y-4">
              {transactions.map((transaction) => (
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
                        {transaction.time}
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Charts and Analytics */}
        <div className="space-y-6 lg:col-span-2">
          {/* Available Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Available</h3>
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

          {/* Income & Expense Cards */}
          {incomeExpenseData.map((data, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 capitalize">
                  {data.type}
                </h3>
                <button className="text-gray-400 hover:text-gray-600 hover:cursor-pointer">
                  ⋯
                </button>
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
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
