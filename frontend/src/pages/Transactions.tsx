import { useState, useEffect } from "react";
import { authFetch } from "../services/firebaseFetch";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchTransactions = async () => {
    const response = await authFetch("http://localhost:4000/api/dashboard/transactions", {
      method: "GET",
    });
    const data = await response.json();
    console.log("Fetched data:", data);
    setTransactions(data.transactions);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter((t) => {
    const term = searchTerm.trim().toLowerCase();
    
    if (!term) return true;

    const name = t.name || "";
    const categories = t.category || [];

    const nameMatch = name.toLowerCase().startsWith(term);
    const categoryMatch = categories.some(category =>
      typeof category === "string" && category.toLowerCase().startsWith(term)
    );

    return nameMatch || categoryMatch;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-center p-6">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 p-4 rounded w-full"
          />
        </div>
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-Black-900 px-2">
            Transactions
          </h3>
        <select
            // value={sortOption}
            // onChange={(e) => setSortOption(e.target.value)}
            className="border border-gray-300 rounded p-2"
          >
            <option value="" hidden>Sort by</option>
            <option value="name-asc">Name Ascending</option>
            <option value="name-desc">Name Descending</option>
            <option value="date-asc">Date Earliest</option>
            <option value="date-desc">Date Latest</option>
            <option value="amount-asc">Amount Ascending</option>
            <option value="amount-desc">Amount Descending</option>
          </select>
        </div>

        <div className="grid grid-cols-4 font-semibold text-gray-800 p-4 px-2 hover:bg-gray-50">
          <div>Name</div>
          <div>Time</div>
          <div>Category</div>
          <div className="text-right">Amount</div>
        </div>

    <div className="space-y-2">
      {filtered.map((transaction) => (
      <div
        key={transaction.id}
        className="grid grid-cols-4 items-center px-2 py-2 rounded-lg hover:bg-gray-50 transition-all"
      >
        <div 
          className="text-sm text-400">{transaction.name}
        </div>
        <div 
          className="text-sm text-gray-500">{transaction.time}
        </div>
        <div 
          className="text-sm text-gray-500">{transaction.category?.join(", ")}
        </div>
        <div 
          className={`text-sm text-right px-2 py-1 rounded-md font-medium inline-block
            ${transaction.amount >= 0
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'}`}
        >{transaction.amount}
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
  