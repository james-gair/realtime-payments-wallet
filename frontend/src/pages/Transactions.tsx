import { useState, useEffect } from "react";
import { authFetch } from "../services/firebaseFetch";
import { ErrorModal } from "../components/ErrorModal";
import { VITE_BACKEND_URL } from "../constants";

//define backend
const backendUrl = VITE_BACKEND_URL;

interface Transaction {
  id: number;
  transaction_id: number;
  name: string;
  amount: string;
  icon: string;
  direct_icon: string;
  symbol: string;
  fallback: string;
  color: string;
  time: string;
  category: string[];
}

type TransactionFilters = {
  category?: string;       
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  sort?: string;
  searchTerm?: string;
};

type Categories = {
  category_id: number;       
  category: string;
  parent?: number;
};

// converts fetched json to CSV format
function jsonToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return "";
  const ignoreColumns: string[] = ["transaction_id", "id", "direct_icon","fallback_icon","icon"];

  const keys = Object.keys(data[0]).filter(key => !ignoreColumns.includes(key));
  const header = keys.join(",");

  const rows = data.map(row =>
    keys.map(key => JSON.stringify(row[key] ?? "")).join(",")
  );

  return [header, ...rows].join("\n");
}

// initiate writing to file
function downloadCSV(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  const today = new Date().toISOString().slice(0, 10);
  const fileName = `Transactions-${today}.csv`

  link.href = URL.createObjectURL(blob);  
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function capitalise(word: string) {
  if (!word) {
    return "";
  } else {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
}

function Transactions() {
  // set transactions being displayed
  const [displayedTransactions, setDisplayedTransactions] = useState<Transaction[]>([]);
  
  // advanced search variables
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [transactionCategories, setTransactionCategories] = useState<Categories[]>([]);
  const [inputFilters, setInputFilters] = useState<TransactionFilters>({
    category: undefined,  
    minAmount: undefined,    
    maxAmount: undefined,
    startDate: undefined,
    endDate: undefined,
    sort: undefined,
    searchTerm: undefined,
  });
  const [appliedFilters, setAppliedFilters] = useState<TransactionFilters>({
    category: undefined,  
    minAmount: undefined,    
    maxAmount: undefined,
    startDate: undefined,
    endDate: undefined,
    sort: undefined,
    searchTerm: undefined,
  });

  const [showDownloadCSV, setDownloadCSV] = useState(false);
  const [categoryPopup, setCategoryPopup] = useState<string[] | null>(null);
  const [showNewCategory, setNewCategory] = useState<boolean>(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [addCategory, setAddCategory] = useState<string[]>([]);
  const [deleteCategory, setDeleteCategory] = useState<string[]>([]);

  // error handling
  const [errorMessage, setErrorMessage] = useState<string | null>("");
  
  // downloads transaction history to csv file
  async function downloadCSVData() {
    try {
      const response = await authFetch(`${backendUrl}/api/transactions`);
      const data = await response.json();
      const csv = jsonToCSV(data.transactions);
      downloadCSV(csv);
    } catch (err) {
      console.error("Failed to download CSV", err);
    }
  }

  // remove single category from proveided transaction
  async function removeCategoryFromTransaction(transactionId: number, category: string[]) {
    try {
      const response = await authFetch(`${backendUrl}/api/transactions/${transactionId}/category`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ category })
      });

      if (!response.ok) {
        throw new Error("Failed to remove category");
      }

      return await response.json();
    } catch (error) {
      console.error("Error removing category:", error);
      throw error;
    }
  }

  async function addCategoryFromTransaction(transactionId: number, category: string[]) {
    try {
      const response = await authFetch(`${backendUrl}/api/transactions/${transactionId}/category`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ category })
      });

      if (!response.ok) {
        throw new Error("Failed to add category");
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding category:", error);
      throw error;
    }
  }

  const fetchTransactions = async () => {
      try {
        // builds query based on advanced filters
        function buildQuery(filters: Record<string, any>): string {
          const params = new URLSearchParams();

          for (const [key, value] of Object.entries(filters)) {
            if (value === undefined || value === null) continue;
            if (Array.isArray(value)) {
              if (value.length === 0) continue;
              value.forEach(v => params.append(key, v));
            } else if (value !== "") {
              params.append(key, value.toString());
            }
          }
          return params.toString();
        }
        
        const query = buildQuery(inputFilters);
        const response = await authFetch(`${backendUrl}/api/transactions${query ? `?${query}` : ""}`);
        const responseCategories = await authFetch(`${backendUrl}/api/transactions/categories`);
        
        const data = await response.json();
        const dataCategories = await responseCategories.json();

        // display data
        setDisplayedTransactions(data.transactions || []);
        setTransactionCategories(dataCategories.categories);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setErrorMessage("Cannot retrieve transactions history. Please try again later.");
      }
    };
  
  // allow for delay before successive fetch calls
  useEffect(() => {
    if (!showAdvanced) {
      const handler = setTimeout(() => {
        setAppliedFilters(prev => ({ ...prev, searchTerm: inputFilters.searchTerm }));
      }, 100);

      return () => clearTimeout(handler);
    }
  }, [inputFilters.searchTerm, showAdvanced]);

  // fetch transactions data
  useEffect(() => {
    fetchTransactions();
  }, [appliedFilters, categoryPopup]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 sm:p-6 p-6">
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Search transactions..."
          onChange={(e) => setInputFilters(prevFilters => ({
            ...prevFilters,      
            searchTerm: e.target.value 
          }))}
          className="sm:w-64 border border-gray-300 p-2 rounded-xl w-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
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
          <div className="flex flex-wrap gap-4 sm:space-x-4 sm:flex-nowrap">
            <input
              type="date"
              onChange={(e) => setInputFilters(prevFilters => ({
                ...prevFilters,       
                startDate: e.target.value 
              }))}

              className="flex-1 border border-gray-300 px-3 py-2 rounded-lg"
            />
            <input
              type="date"
              onChange={(e) => setInputFilters(prevFilters => ({
                ...prevFilters,      
                endDate: e.target.value 
              }))}
              className="flex-1 border border-gray-300 px-3 py-2 rounded-lg"
            />
            <select
              onChange={(e) => setInputFilters(prevFilters => ({
                ...prevFilters,         
                sort: e.target.value 
              }))}
              className={` flex-1 border border-gray-300 rounded-lg px-3 py-2 w-80`}
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
          <div className="flex flex-wrap gap-4 sm:space-x-4 sm:flex-nowrap">
            <input
              type="number"
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                setInputFilters(prevFilters => ({
                  ...prevFilters,
                  minAmount: value === '' ? undefined : Number(value),
                }));
              }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') {
                  e.preventDefault();
                }
              }}
              className="flex-1 border border-gray-300 px-3 py-2 rounded-lg"
              placeholder="Amount From"
            />
            <input
              type="number"
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                setInputFilters(prevFilters => ({
                  ...prevFilters,
                  maxAmount: value === '' ? undefined : Number(value),
                }));
              }}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') {
                  e.preventDefault();
                }
              }}
              className="flex-1 border border-gray-300 px-3 py-2 rounded-lg"
              placeholder="Amount To"
            />
            <select
              className={`flex-1 border border-gray-300 rounded-lg px-3 py-2 w-80`}
              onChange={(e) => {
                setInputFilters(prev => ({ ...prev, category: e.target.value }));
              }}
            >
              <option value="" hidden>Select Category</option>
              <option value="">All</option>
              {transactionCategories.map((item, index) => (
                <option key={index} value={item.category}>
                  {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-8 mb-4">
            <button
              onClick={() => {setAppliedFilters({ ...inputFilters })
              if (showDownloadCSV) downloadCSVData();
              }}
              className="bg-blue-600 text-white px-16 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>

            <label className="flex items-center gap-2 text-sm ">
              <input
                type="checkbox"
                checked={showDownloadCSV}
                onChange={(e) => setDownloadCSV(e.target.checked)}
              />
              Download as CSV
            </label>
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
              onChange={(e) => {
                setInputFilters(prevFilters => ({
                  ...prevFilters,
                  sort: e.target.value
                }));
                setAppliedFilters(inputFilters);
              }}
              className={`border border-gray-300 rounded p-2 w-40 text-center`}
            >
              <option value="" hidden>Sort by</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="amount-asc">Amount ↑</option>
              <option value="amount-desc">Amount ↓</option>              
              <option value="date-asc">Date ↑</option>
              <option value="date-desc">Date ↓</option>
            </select>
        )}

        {categoryPopup && (
          <div
            onClick={() => {
                setNewCategory(false);
                setCategoryPopup(null);
                setAddCategory([]);
                setDeleteCategory([]);
              }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()} // stop closing when clicking inside
              className="bg-white p-4 rounded-lg max-w-lg w-full shadow-lg"
            >
              <h2 className="text-lg font-semibold mb-2">Categories</h2>
              <div className="flex flex-wrap gap-2">
              
              {categoryPopup.map((cat, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 cursor-pointer select-none bg-blue-50 rounded px-2 py-1 hover:bg-blue-200"
                >
                  <span className="mr-2">{capitalise(cat)}</span>
                  <button
                    onClick={async () => {
                      const newCategories = categoryPopup.filter((_, i) => i !== index);
                      setCategoryPopup(newCategories);
                      setDeleteCategory(prevCategories => [...prevCategories, cat]);
                    }}
                    className="text-gray-400 hover:text-red-600 font-bold text-xs ml-1"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
                <div
                  className="flex items-center gap-1 cursor-pointer select-none bg-blue-50 rounded px-2 py-1 hover:bg-blue-200"
                >

                {showNewCategory ? (
                  <select
                    className="flex-1 border border-gray-300 px-3 py-2 rounded-lg"
                    onChange={async (e) => {
                      const selectedCategory = e.target.value;
                      if (!selectedTransactionId || !selectedCategory) return;
                      setAddCategory(prevCategories => [...prevCategories, selectedCategory]);
                      setAppliedFilters(prev => ({ ...prev })); // Trigger refetch
                      setCategoryPopup(prev =>
                        prev ? [...prev, selectedCategory] : [selectedCategory]
                      );
                      setNewCategory(false);                    // Hide dropdown
                    }}
                  >
                    <option value="" hidden>Select Category</option>
                    <option value="">All</option>
                    {transactionCategories
                      .filter(item => !categoryPopup?.includes(item.category))
                      .map((item, index) => (
                      <option key={index} value={item.category}>
                        {capitalise(item.category)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <button
                    onClick={() => setNewCategory(!showNewCategory)}
                    className="text-blue-400 font-bold text-xs ml-1"
                    title="Add"
                    >
                      Add New +
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={async () => {
                setNewCategory(false);
                setCategoryPopup(null);
                setAppliedFilters(prev => ({ ...prev }));
                
                try {
                  if (selectedTransactionId) {
                    if (Array.isArray(addCategory) && addCategory.length > 0) {
                      await addCategoryFromTransaction(selectedTransactionId, addCategory);
                    }

                    if (Array.isArray(deleteCategory) && deleteCategory.length > 0) {
                      await removeCategoryFromTransaction(selectedTransactionId, deleteCategory);
                    }

                    await fetchTransactions(); 
                  }
                } catch (err) {
                  setErrorMessage("Failed to modify categories. Please try again.");
                }

                setAddCategory([]);
                setDeleteCategory([]);
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
          </div>
          )}

      </div>

      <div className="rounded grid grid-cols-1 sm:grid-cols-[1fr_2fr_2fr_1.5fr_1fr] font-semibold text-gray-800 px-2 py-2 hover:bg-gray-50">
        <div>Name</div>
        <div className="hidden sm:block">Time</div>
        <div className="hidden sm:block">Category</div>
        <div className="hidden sm:block text-center">Incoming/Outgoing</div>
        <div className="text-right">Amount</div>
      </div>

    <div className="space-y-2">
      {displayedTransactions.map((transaction) => (
      <div
        key={transaction.id}
        className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_2fr_1.5fr_1fr] items-center sm:px-2 sm:py-2 rounded hover:bg-gray-50 transition-all"
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
      <div className="flex flex-wrap gap-2">
        {transaction.category?.map((catItem, idx) => (
          <div
            key={idx}
            onClick={() => {
              setCategoryPopup(transaction.category || []);
              setSelectedTransactionId(transaction.id);
            }}

            className="flex items-center gap-1 cursor-pointer select-none bg-blue-50 rounded px-2 py-1 hover:bg-blue-200"
            title={`Click ${catItem}`}
          >
            <div className="text-sm text-gray-700">{capitalise(catItem)}</div>
          </div>
        ))}
      </div>
      <div className="hidden sm:block text-center">
        <div
          className={`text-sm px-2 py-1 rounded-xl font-medium inline-block
            ${parseFloat(transaction.amount) >= 0
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'}`}>
            {parseFloat(transaction.amount) > 0 ? "Incoming" : "Outgoing"}
        </div>
      </div>
      <div 
        className="text-sm text-right px-2 py-1 rounded-xl font-medium inline-block"
      > {parseFloat(transaction.amount) < 0
        ? `-${transaction.symbol}${Math.abs(parseFloat(transaction.amount)).toFixed(2)}`
        : `${transaction.symbol}${transaction.amount}`}
      </div>
      <div className="col-span-full flex justify-end mt-2">
      <div className="w-full border-b border-gray-200" />   
      </div>     
      </div>
    ))}
  </div>
    </div>  
      {errorMessage && (
            <ErrorModal
              errorMessage={errorMessage}
              onClose={() => setErrorMessage(null)}
            />
      )}
    </div>
  )
};
  
  export default Transactions;
  