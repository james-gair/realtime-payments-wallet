import { render, screen } from "@testing-library/react";
import user from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "../pages/Register";

// Mock Firebase functions
jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
}));

// Mock Firebase service to avoid import.meta.env crash
jest.mock("../services/firebase", () => ({
  auth: {},
}));

// Mock authFetch
jest.mock("../services/firebaseFetch", () => ({
  authFetch: jest.fn(),
}));

describe("Register validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupForm = async ({
  firstName = "John",
  lastName = "Doe",
  username = "johndoe",
  email = "john@example.com",
  password = "Password123!",
  confirmPassword = "Password123!",
} = {}) => {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

  if (firstName) await user.type(screen.getByLabelText(/first name/i), firstName);
  if (lastName) await user.type(screen.getByLabelText(/last name/i), lastName);
  if (username) await user.type(screen.getByLabelText(/username/i), username);
  if (email) await user.type(screen.getByLabelText(/email address/i), email);
  if (password) await user.type(screen.getByLabelText(/^password$/i), password);
  if (confirmPassword) await user.type(screen.getByLabelText(/confirm password/i), confirmPassword);

  await user.click(screen.getByRole("button", { name: /register/i }));
};


  it("shows error if passwords do not match", async () => {
    await setupForm({
      password: "Password123!",
      confirmPassword: "WrongPassword456!",
    });

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("shows error if username is fewer than 3 characters", async () => {
    await setupForm({ username: "ab" });

    expect(await screen.findByText(/username must be at least 3 characters/i)).toBeInTheDocument();
  });

  it("shows error if first name is missing", async () => {
    await setupForm({ firstName: "" });

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument();
  });

  it("shows error if last name is missing", async () => {
    await setupForm({ lastName: "" });

    expect(await screen.findByText(/last name is required/i)).toBeInTheDocument();
  });
});
