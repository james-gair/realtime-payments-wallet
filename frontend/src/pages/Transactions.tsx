import { useState, useEffect } from "react";
import { authFetch } from "../services/firebaseFetch";

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  
  const fetchTransactions = async () => {
    const response = await authFetch("http://localhost:4000/api/dashboard/transactions", {
      method: "GET",
    });
    const data = await response.json();
    console.log("Fetched data:", data);
    setTransactions(data.transactions);
    setFilteredTransactions(data.transactions);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

useEffect(() => {
  const term = searchTerm.trim().toLowerCase();

  const filtered = transactions.filter((tx) => {
    if (!term) return true; // Show all if search is empty

    const name = tx.name || "";
    const categories = tx.category || [];

    const nameMatch = name.toLowerCase().startsWith(term);
    const categoryMatch = categories.some(cat =>
      typeof cat === "string" && cat.toLowerCase().startsWith(term)
    );

    return nameMatch || categoryMatch;
  });

  setFilteredTransactions(filtered);
}, [searchTerm, transactions]);

    

    return (
      <div className="max-w-sm mx-auto p-4">
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        />

        <ul>
          {filteredTransactions.map((tx) => (
            <li key={tx.transaction_id} className="border-b py-2">
              <strong>{tx.name}</strong> — ${tx.amount}
              <br />
              Category: {tx.category?.join(", ")}
            </li>
          ))}
        </ul>
      </div>
    );
}
  
  export default Transactions;
  