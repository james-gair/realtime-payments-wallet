import { render, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import LoginPage from "../pages/LoginPage";
import { signInWithEmailAndPassword } from "firebase/auth";
import "@testing-library/jest-dom";

// Mock navigate from react-router-dom
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

// Mock Firebase auth function
jest.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

// Mock your firebase service files
jest.mock("../services/firebase", () => ({
  auth: {},
}));

jest.mock("../services/firebaseFetch", () => ({
  authFetch: jest.fn(),
}));

import { authFetch } from "../services/firebaseFetch";

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email, password fields and sign in button", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("successful login navigates to dashboard", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({});
    (authFetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), "test@example.com", "password123");
    });
    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith("http://localhost:4000/api/login", { method: "POST" });
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows 'Incorrect password.' error on auth/wrong-password", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({ code: "auth/wrong-password" });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email address/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument();
  });

  it("shows 'No account found with this email.' error on auth/user-not-found", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({ code: "auth/user-not-found" });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email address/i), "nouser@example.com");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/no account found/i)).toBeInTheDocument();
  });

  it("shows generic error message on unknown error", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
      code: "unknown-error",
      message: "Something went wrong.",
    });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email address/i), "error@example.com");
    await user.type(screen.getByLabelText(/password/i), "pass");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });


  it("shows error if authFetch returns error response", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({});
    (authFetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Login failed due to server error" }),
    });

    render(<LoginPage />);
    await user.type(screen.getByLabelText(/email address/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText(/login failed due to server error/i)).toBeInTheDocument();
  });
});