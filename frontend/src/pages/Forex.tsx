import { useEffect, useState } from "react";
import { authFetch } from "../services/firebaseFetch"; 
interface Rates {
  [currency: string]: number;
}

function Forex() {
  const [rates, setRates] = useState<Rates>({});
  const [lastUpdated, setLastUpdated] = useState<string>("");

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
  );
}

export default Forex;
