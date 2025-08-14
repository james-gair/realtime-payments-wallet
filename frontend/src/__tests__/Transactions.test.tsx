// Transactions.test.tsx
import { render, screen } from "@testing-library/react";
import Transactions from "../pages/Transactions";
import user from "@testing-library/user-event";

jest.mock("../services/firebase", () => ({
	auth: {
		currentUser: {
			getIdToken: jest.fn(() => Promise.resolve("fake-token")),
		},
	},
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
	...jest.requireActual("react-router-dom"),
	useNavigate: jest.fn(() => mockNavigate),
}));

// mock env
jest.mock("../constants", () => ({
	VITE_BACKEND_URL: "http://mock-backend",
}));

global.fetch = jest.fn((url) => {
  if (typeof url === "string") {
    if (url.endsWith("/api/transactions")) {
      // Return transactions
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ transactions: mockTransactions }),
			});
    }
    if (url.endsWith("/api/transactions/categories")) {
      // Return categories
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ categories: mockCategories }),
      });
    }
  }
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({}),
  });
}) as jest.Mock;

const mockTransactions = [
  {
    id: 1,
    name: "Groceries",
    amount: -50.25,
    icon: "🛍️",
    color: "#34D399",
    time: "2025-08-01T10:30:00Z",
    category: ["food"],
    symbol: "$"
  },
  {
    id: 2,
    name: "Salary",
    amount: 2500,
    icon: "💳",
    color: "#3B82F6",
    time: "2025-07-31T08:00:00Z",
    category: ["finance"],
    symbol: "$"
  },
  {
    id: 3,
    name: "Electricity",
    amount: -120.50,
    icon: "💡",
    color: "#FBBF24",
    time: "2025-07-28T14:00:00Z",
    category: ["utilities"],
    symbol: "$"
  }
];

const mockCategories = [
  "food",
	"finance",
  "utilities",
  "transport",
  "entertainment"
];

describe("Transactions", () => {
  beforeEach(() => {
		jest.clearAllMocks();
  });

  it("displays transactions", async () => {
    render(<Transactions />);

    for (const txn of mockTransactions) {
      // Use findByText to await element appearing after fetch
      expect(await screen.findByText(txn.name)).toBeInTheDocument();

      const formattedAmount = txn.amount < 0
        ? `-$${Math.abs(txn.amount).toFixed(2)}`
        : `$${txn.amount}`;

      expect(await screen.findByText(formattedAmount)).toBeInTheDocument();
    }
  });

	it("test search function", async () => {
    render(<Transactions />);

    for (const txn of mockTransactions) {
      expect(await screen.findByText(txn.name)).toBeInTheDocument();
    }

    const searchInput = screen.getByPlaceholderText("Search transactions...");

    await user.clear(searchInput);
    await user.type(searchInput, "salary");

    expect(searchInput).toHaveValue("salary");
  });

	it("checks sort box", async () => {
    render(<Transactions />);

    const sortSelect = screen.getByRole("combobox");
    expect(sortSelect).toHaveValue("");

    await user.selectOptions(sortSelect, "name-asc");
    expect(sortSelect).toHaveValue("name-asc");

    await user.selectOptions(sortSelect, "name-desc");
    expect(sortSelect).toHaveValue("name-desc");

    await user.selectOptions(sortSelect, "amount-asc");
    expect(sortSelect).toHaveValue("amount-asc");

    await user.selectOptions(sortSelect, "amount-desc");
    expect(sortSelect).toHaveValue("amount-desc");

    await user.selectOptions(sortSelect, "date-asc");
    expect(sortSelect).toHaveValue("date-asc");

    await user.selectOptions(sortSelect, "date-desc");
    expect(sortSelect).toHaveValue("date-desc");
  });
});