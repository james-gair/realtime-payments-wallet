
import { render, screen, fireEvent, } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Profile from "../pages/Profile";
import { authFetch } from "../services/firebaseFetch";

// Mock authFetch
jest.mock("../services/firebaseFetch", () => ({
  authFetch: jest.fn(),
}));

const mockProfile = {
  email: "john@example.com",
  phone: "+1234567890",
  address: "123 Elm Street",
};

describe("Profile page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads and displays current profile info", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce({
      text: async () => JSON.stringify(mockProfile),
    });

    render(<Profile />);

    // Current user info rendered after fetch
    expect(await screen.findByText(/john@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/\+1234567890/)).toBeInTheDocument();
    expect(screen.getByText(/123 Elm Street/)).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce({
      text: async () => JSON.stringify(mockProfile),
    });

    render(<Profile />);

    await screen.findByText(/john@example.com/i);

    const emailInput = screen.getByPlaceholderText(/enter new email/i);
    await userEvent.type(emailInput, "invalidemail");

    fireEvent.click(screen.getByText(/save/i));

    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid phone number", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce({
      text: async () => JSON.stringify(mockProfile),
    });

    render(<Profile />);

    await screen.findByText(/john@example.com/i);

    const contactInput = screen.getByPlaceholderText(/enter new contact number/i);
    await userEvent.type(contactInput, "invalidphone");

    fireEvent.click(screen.getByText(/save/i));

    expect(await screen.findByText(/valid contact number/i)).toBeInTheDocument();
  });

  it("shows error when no changes are made", async () => {
    (authFetch as jest.Mock).mockResolvedValueOnce({
      text: async () => JSON.stringify(mockProfile),
    });

    render(<Profile />);

    await screen.findByText(/john@example.com/i);

    fireEvent.click(screen.getByText(/save/i));

    expect(await screen.findByText(/no changes detected/i)).toBeInTheDocument();
  });

  it("successfully updates profile and clears inputs", async () => {
    (authFetch as jest.Mock)
      .mockResolvedValueOnce({
        text: async () => JSON.stringify(mockProfile),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: "new@example.com",
          phone: "+1987654321",
          address: "456 Oak Avenue",
        }),
      });

    render(<Profile />);

    await screen.findByText(/john@example.com/i);

    await userEvent.type(screen.getByPlaceholderText(/enter new email/i), "new@example.com");
    await userEvent.type(screen.getByPlaceholderText(/enter new contact number/i), "+1987654321");
    await userEvent.type(screen.getByPlaceholderText(/enter new billing address/i), "456 Oak Avenue");

    fireEvent.click(screen.getByText(/save/i));

    expect(await screen.findByText(/profile updated successfully/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter new email/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/enter new contact number/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/enter new billing address/i)).toHaveValue("");
  });

  it("displays API error on failed update", async () => {
    (authFetch as jest.Mock)
      .mockResolvedValueOnce({
        text: async () => JSON.stringify(mockProfile),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Something went wrong" }),
      });

    render(<Profile />);

    await screen.findByText(/john@example.com/i);

    await userEvent.type(screen.getByPlaceholderText(/enter new email/i), "fail@example.com");

    fireEvent.click(screen.getByText(/save/i));

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });
});