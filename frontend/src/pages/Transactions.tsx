import { useState, useEffect } from "react";
import { authFetch } from "../services/firebaseFetch";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("date-desc");
  const [filterCategory, setFilterCategory] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromAmount, setFromAmount] = useState(0);
  const [toAmount, setToAmount] = useState(0);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  
  const fetchTransactions = async () => {
    const response = await authFetch("http://localhost:4000/api/dashboard/transactions", {
      method: "GET",
    });
    const data = await response.json();
    console.log("Fetched data:", data);
    setTransactions(data.transactions || []);
    setDisplayedTransactions(data.transactions || []);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const term = searchTerm.trim().toLowerCase();  
    // console.log(term)  
    if (!term) return true;

    const name = t.name || "";
    const categories = t.category || [];

    const nameMatch = name.toLowerCase().startsWith(term);
    const categoryMatch = categories.some(category =>
      typeof category === "string" && category.toLowerCase().startsWith(term)
    );

    return nameMatch || categoryMatch;
  });

  const advancedSearch = transactions.filter((t) => {
    const term = searchTerm.trim().toLowerCase();
    // console.log(term)

    const name = t.name || "";
    const categories = t.category || [];

    const nameMatch = name.toLowerCase().startsWith(term);
    const categoryMatch = categories.some(category =>
      typeof category === "string" && category.toLowerCase().startsWith(term)
    );

    const textMatch = (!term || nameMatch || categoryMatch) && categories.includes(filterCategory.toLowerCase());

    const date = new Date(t.date || t.time || "");
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    const dateInRange = (!from || date >= from) && (!to || date <= to);
            // console.log(dateInRange)

    const amountInRange = (!fromAmount || fromAmount <= Math.abs(t.amount)) && (!toAmount || toAmount >= Math.abs(t.amount));

    return textMatch && dateInRange && amountInRange;
  });

  const sortedTransactions = (arr) => {
    return [...arr].sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);

        case 'date-asc':
          return new Date(a.time) - new Date(b.time);
        case 'date-desc':
          return new Date(b.time) - new Date(a.time);

        case 'amount-asc':
          return Math.abs(a.amount) - Math.abs(b.amount);
        case 'amount-desc':
          return Math.abs(b.amount) - Math.abs(a.amount);

        default:
          return 0;
      }
    });
  };

  useEffect(() => {
    if (!showAdvanced) {
      setDisplayedTransactions(sortedTransactions(filteredTransactions));
    }
  }, [searchTerm, sortOption, transactions, showAdvanced]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-2 rounded-xl w-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
          />
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showAdvanced ? "Hide Advanced" : "Advanced Search"}
          </button>
        </div>

        
        {/* Advanced Fields */}
      {showAdvanced && (
        <div className="mt-4 mb-4 space-y-3 animate-fade-in text-gray-600">
          <div className="flex space-x-4">
            <input
              type="date"
              onChange={(e) => setFromDate(e.target.value)}
              className="flex-1 border border-gray-300 px-3 py-2 rounded-lg"
              placeholder="From date"
            />
            <input
              type="date"
              onChange={(e) => setToDate(e.target.value)}
              className="flex-1 border border-gray-300 px-3 py-2 rounded-lg"
              placeholder="To date"
            />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className={` flex-1 border border-gray-300 rounded-lg px-3 py-2 w-80 ${
              sortOption === '' ? 'text-gray-500' : 'text-gray'
              }`}
            >
              <option value="" hidden>Sort by</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="date-asc">Date Earliest</option>
              <option value="date-desc">Date Latest</option>
              <option value="amount-asc">Amount Ascending</option>
              <option value="amount-desc">Amount Descending</option>
            </select>           
          </div>
          <div className="flex space-x-4">
            <input
              type="number"
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 border border-gray-300 px-3 py-2 rounded-lg"
              placeholder="Amount From"
            />
            <input
              type="number"
              onChange={(e) => setToAmount(e.target.value)}
              className="flex-1 border border-gray-300 px-3 py-2 rounded-lg"
              placeholder="Amount To"
            />
            <select
            className="flex-1 border border-gray-300 px-3 py-2 rounded-lg"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="" hidden>Select Category</option>
              <option value="Software">Software</option>
              <option value="Subscription">Subscription</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => {
                setDisplayedTransactions(sortedTransactions(advancedSearch));
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-Black-900 px-2">
            Transactions
          </h3>
        {!showAdvanced && (
          <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className={`border border-gray-300 rounded p-2 w-32 ${
              sortOption === '' ? 'text-gray-500' : 'text-gray'
              }`}
            >
              <option value="" hidden>Sort by</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="date-asc">Date Earliest</option>
              <option value="date-desc">Date Latest</option>
              <option value="amount-asc">Amount Ascending</option>
              <option value="amount-desc">Amount Descending</option>
            </select>
          )}
        </div>

        <div className="rounded grid grid-cols-[1fr_2fr_2fr_1.5fr_1fr] font-semibold text-gray-800 px-2 py-2 hover:bg-gray-50">
          <div>Name</div>
          <div>Time</div>
          <div>Category</div>
          <div className="text-center">Incoming/Outgoing</div>
          <div className="text-right">Amount</div>
        </div>

    <div className="space-y-2">
      {displayedTransactions.map((transaction) => (
      <div
        key={transaction.id}
        className="grid grid-cols-[1fr_2fr_2fr_1.5fr_1fr] items-center px-2 py-2 rounded hover:bg-gray-50 transition-all"
      >
        <div 
          className="text-sm text-400">{transaction.name}
        </div>
        <div 
          className="text-sm text-gray-500"> 
          <div>
            {new Date(transaction.time).toLocaleDateString("en-GB", {
              year: 'numeric',
              day: '2-digit',
              month: '2-digit',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </div>
        </div>
        <div 
          className="text-sm text-gray-500">{transaction.category?.join(", ")}
        </div>
        <div className="text-center">
          <div
            className={`text-sm px-2 py-1 rounded-xl font-medium inline-block
              ${transaction.amount >= 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'}`}>
            {transaction.amount > 0 ? "Incoming" : "Outgoing"}
          </div>
        </div>
        <div 
          className="text-sm text-right px-2 py-1 rounded-xl font-medium inline-block"
        >{transaction.amount < 0
          ? `($${Math.abs(transaction.amount).toFixed(2)})`
          : `$${transaction.amount}`}
        </div>
        <div className="col-span-full flex justify-end mt-2">
          <div className="w-full border-b border-gray-200" />   
        </div>     
      </div>
    ))}
  </div>
  </div>  
</div>
)};
  
  export default Transactions;
  