import { Request, Response } from "express";

export async function getExchangeRates(req: Request, res: Response) {
  const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
  const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/AUD`;

  try {
    const response = await fetch(BASE_URL);
    const data = await response.json();

    const filteredRates = {
      USD: data.conversion_rates?.USD,
      EUR: data.conversion_rates?.EUR,
      JPY: data.conversion_rates?.JPY,
      GBP: data.conversion_rates?.GBP,
    };

    return res.status(200).json({
      base: "AUD",
      lastUpdated: data.time_last_update_utc,
      rates: filteredRates,
    });
  } catch (err) {
    console.error("Error fetching FX rates:", err);
    return res.status(500).json({ error: "Failed to fetch exchange rates" });
  }
}

// for actual currency exchange
export async function fetchSpecificExchangeRate(fromCurrencyCode: string, toCurrencyCode: string): Promise<number> {
  const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
  const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${fromCurrencyCode}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const rate = data.conversion_rates?.[toCurrencyCode];

    if (!rate) {
      throw new Error(`exchange rate not found for ${fromCurrencyCode} to ${toCurrencyCode}`);
    }

    return rate;
  } catch (err) {
    console.error("fetchExchangeRate ere:", err);
    throw new Error("exchange rate fetch fail");
  }
}

