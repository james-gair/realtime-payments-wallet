// KYCApplication.test.tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import user from "@testing-library/user-event";
import { KYCApplication } from "../pages/KYCApplication";
import "@testing-library/jest-dom";
import React from "react";

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

// mock fetch
global.fetch = jest.fn(() => {
  // console.log("FETCH CALLED");
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
}) as jest.Mock;

// mock webcame capture
jest.mock("../components/WebcameCapture", () => {
  return {
    WebcamCapture: ({ onCapture }: { onCapture: (file: File) => void }) => {
      React.useEffect(() => {
        // have to use useEffect to set it once otherwise infinite loop
        onCapture(new File(["selfie"], "selfie.jpg", { type: "image/jpeg" }));
      }, []);
      return <div>Mocked WebcamCapture</div>;
    },
  };
});

describe("KYCApplication", () => {
  beforeEach(() => {
    render(<KYCApplication />);
  });
  it("submit the form, successful for driver's license", async () => {
    await user.type(getFullName(), "Emily Chen");
    await user.type(getDOB(), "1994-06-15");
    await user.click(getDriverLicenseRadio());
    expect(getDriverLicenseRadio()).toBeChecked();

    await waitFor(() => {
      expect(getLicenseNumber()).toBeInTheDocument();
      expect(getDriverLicensePhotoInput()).toBeInTheDocument();
    });

    await user.type(getLicenseNumber(), "NSW123456");
    await user.type(getStateOfIssue(), "NSW");
    await user.type(getLicenseExpiry(), "2026-01-10"); // Also use YYYY-MM-DD

    const licenseFile = new File(["photo"], "license.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(getDriverLicensePhotoInput(), {
      target: { files: [licenseFile] },
    });
    expect(getFullName()).toHaveValue("Emily Chen");
    expect(getDOB()).toHaveValue("1994-06-15");
    expect(getDriverLicenseRadio()).toBeChecked();
    expect(getLicenseNumber()).toHaveValue("NSW123456");
    expect(getStateOfIssue()).toHaveValue("NSW");
    expect(getLicenseExpiry()).toHaveValue("2026-01-10");

    const fileInput = getDriverLicensePhotoInput() as HTMLInputElement;
    expect(fileInput.files?.[0].name).toBe("license.jpg");
    expect(fileInput.files?.[0].type).toBe("image/jpeg");
    await waitFor(() => {
      // your mocked WebcamCapture sets this
      expect(screen.getByText(/Mocked WebcamCapture/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);
    await waitFor(() => {
      const hiddenSelfieInput = screen.getByTestId("selfie-input");
      expect(hiddenSelfieInput).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/kyc/success");
    });
  });

  it("submits the form successfully for passport", async () => {
    await user.type(getFullName(), "Emily Chen");
    await user.type(getDOB(), "1994-06-15");

    // Select passport
    await user.click(getPassportRadio());
    expect(getPassportRadio()).toBeChecked();

    await waitFor(() => {
      expect(getPassportNumber()).toBeInTheDocument();
      expect(getPassportPhotoInput()).toBeInTheDocument();
    });

    await user.type(getPassportNumber(), "P123456789");
    await user.type(getCountryOfIssue(), "Australia");
    await user.type(getPassportExpiry(), "2029-12-31");

    const passportFile = new File(["photo"], "passport.jpg", {
      type: "image/jpeg",
    });
    fireEvent.change(getPassportPhotoInput(), {
      target: { files: [passportFile] },
    });

    const fileInput = getPassportPhotoInput() as HTMLInputElement;
    expect(fileInput.files?.[0].name).toBe("passport.jpg");
    expect(fileInput.files?.[0].type).toBe("image/jpeg");

    await waitFor(() => {
      expect(screen.getByText(/Mocked WebcamCapture/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      const hiddenSelfieInput = screen.getByTestId("selfie-input");
      expect(hiddenSelfieInput).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/kyc/success");
    });
  });
});

const getFullName = () => screen.getByLabelText(/Full Name/i);
const getDOB = () => screen.getByLabelText(/Date of Birth/i);

// Driver's license
const getDriverLicenseRadio = () =>
  screen.getByRole("radio", { name: /driver's license/i });

const getLicenseNumber = () => screen.getByLabelText(/License Number/i);
const getStateOfIssue = () => screen.getByLabelText(/state of issue/i);
const getLicenseExpiry = () => screen.getByLabelText(/expiry date/i);
const getDriverLicensePhotoInput = () =>
  screen.getByLabelText(
    /upload a photo of the front of your driver's license/i
  );

// passport
const getPassportRadio = () => screen.getByRole("radio", { name: /passport/i });
const getPassportNumber = () => screen.getByLabelText(/passport number/i);
const getCountryOfIssue = () => screen.getByLabelText(/country of issue/i);
const getPassportExpiry = () => screen.getByLabelText(/expiry date/i);
const getPassportPhotoInput = () =>
  screen.getByLabelText(/upload a photo of the front of your passport/i);
