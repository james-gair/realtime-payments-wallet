import { useState } from "react";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { WebcamCapture } from "../components/WebcameCapture";
import { ErrorModal } from "../components/ErrorModal";
import { VITE_BACKEND_URL } from "../constants";

export function KYCApplication() {
  const backendUrl = VITE_BACKEND_URL;
  const navigate = useNavigate();
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const [idType, setIdType] = useState<"passport" | "driver_license" | "">("");
  const [errorMessage, setErrorMessage] = useState<string | null>("");

  const handleConfirm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const originalFormData = new FormData(event.currentTarget);
    const formData = new FormData();

    if (!idType) {
      setErrorMessage("Please select an ID type");
      return;
    } else {
      formData.append("idType", idType);
    }

    const dob = originalFormData.get("dateOfBirth");
    if (dob) formData.append("dateOfBirth", dob);

    const fullname = originalFormData.get("fullName");
    if (fullname) formData.append("fullName", fullname);

    if (!selfieFile) {
      setErrorMessage("Please upload a selfie photo with ID.");
      return;
    }
    formData.append("selfieWithId", selfieFile);

    // All the fields under the selected ID type should be filled out
    if (idType === "passport") {
      const passportNumber = originalFormData
        .get("passportNumber")
        ?.toString()
        .trim();
      const countryOfIssue = originalFormData
        .get("countryOfIssue")
        ?.toString()
        .trim();
      const passportExpiry = originalFormData
        .get("passportExpiry")
        ?.toString()
        .trim();

      if (!originalFormData.get("passportPhoto") && !licenseFile) {
        setErrorMessage("Please upload your passport photo");
        return;
      }
      const file = originalFormData.get("passportPhoto");

      if (file) {
        formData.append("idPhoto", file);
      } else if (licenseFile) {
        formData.append("idPhoto", licenseFile);
      }

      if (!passportNumber || !countryOfIssue || !passportExpiry) {
        setErrorMessage("Please complete all passport fields.");
        return;
      }
      formData.append("idNumber", passportNumber);
      formData.append("idExpDate", passportExpiry);
      formData.append("placeOfIssue", countryOfIssue);
    } else if (idType === "driver_license") {
      const licenseNumber = originalFormData
        .get("licenseNumber")
        ?.toString()
        .trim();
      const stateOfIssue = originalFormData
        .get("stateOfIssue")
        ?.toString()
        .trim();
      const licenseExpiry = originalFormData
        .get("licenseExpiry")
        ?.toString()
        .trim();
      if (!originalFormData.get("driverLicensePhoto") && !licenseFile) {
        setErrorMessage("Please upload your driver's license photo");
        return;
      }

      const file = originalFormData.get("driverLicensePhoto");

      if (file) {
        formData.append("idPhoto", file);
      } else if (licenseFile) {
        formData.append("idPhoto", licenseFile);
      }

      if (!licenseNumber || !stateOfIssue || !licenseExpiry) {
        setErrorMessage("Please complete all driver's license fields.");
        return;
      }

      formData.append("idNumber", licenseNumber);
      formData.append("idExpDate", licenseExpiry);
      formData.append("placeOfIssue", stateOfIssue);
    }

    const user = auth.currentUser;
    if (!user) throw new Error("not authenticated");

    const idToken = await user.getIdToken();
    // for (const [key, value] of formData.entries()) {
    //   console.log(`${key}: ${value}`);
    // }
    // Send request to the backend

    try {
      const res = await fetch(backendUrl + "/api/kyc", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${idToken}`,
          // Did not use the fecth wrapper here
          // because I should not set it "Content-Type" here,
          // we are sending a photo too,
          // the browser will set it correctly
        },
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(`Error ${res.status}: ${data.error}`);
        console.error("Issues:", data.issues);
        return;
      }
      // Verification successful, inform the user and then redirect to dashboard
      navigate("/kyc/success");
    } catch (err) {
      console.error("Network error", err);
      setErrorMessage("Something went wrong. Please try again later.");
      return;
    }
  };

  return (
    <div className="m-10 bg-white relative">
      <section aria-labelledby="kyc-section-heading">
        <h2 id="kyc-section-heading" className="text-lg font-semibold">
          To keep your account secure, we need to verify your identity before
          you can send or receive money.
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          This helps us keep your account secure and comply with Australian
          financial regulations. You’ll be asked to upload a valid photo ID
          (such as a driver’s licence or passport). We value your privacy — your
          information will be stored securely and only used for verification
          purposes.
        </p>

        <form
          className="mt-6 space-y-6"
          aria-labelledby="kyc-section-heading"
          onSubmit={handleConfirm}
        >
          <div>
            <label htmlFor="fullName" className="block font-medium">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          <div>
            <label htmlFor="dob" className="block font-medium">
              Date of Birth
            </label>
            <input
              type="date"
              id="dob"
              name="dateOfBirth"
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block font-medium">Select ID Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="idType"
                  value="passport"
                  checked={idType === "passport"}
                  onChange={() => setIdType("passport")}
                />
                Passport
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="idType"
                  value="driver_license" // complies with the id check api
                  checked={idType === "driver_license"}
                  onChange={() => setIdType("driver_license")}
                />
                Driver's License
              </label>
            </div>
          </div>

          {idType === "passport" && (
            <div className="space-y-4 border p-4 rounded">
              <label>
                Passport Number
                <input
                  name="passportNumber"
                  className="block border px-2 py-1 w-full rounded"
                  required
                />
              </label>
              <label>
                Country of Issue
                <input
                  name="countryOfIssue"
                  className="block border px-2 py-1 w-full rounded"
                  required
                />
              </label>
              <label>
                Expiry Date
                <input
                  type="date"
                  name="passportExpiry"
                  className="block border px-2 py-1 w-full rounded"
                  required
                />
              </label>

              {isMobile ? (
                <WebcamCapture
                  label="Passport"
                  onCapture={(file) => setLicenseFile(file)}
                />
              ) : (
                <>
                  <input
                    type="file"
                    id="passportPhoto"
                    name="passportPhoto"
                    accept="image/*"
                    className="sr-only inline-block m-10"
                  />
                  <label
                    htmlFor="passportPhoto"
                    className="mt-4 px-4 py-2 bg-gray-300 rounded inline-block hover:cursor-pointer"
                  >
                    Upload a photo of the front of your passport
                  </label>

                  <div>
                    <p className="font-medium">Take a selfie holding your ID</p>
                    <WebcamCapture
                      label="SelfieWithID"
                      onCapture={(file) => setSelfieFile(file)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {idType === "driver_license" && (
            <div className="space-y-4 border p-4 rounded">
              <label>
                License Number
                <input
                  name="licenseNumber"
                  className="block border px-2 py-1 w-full rounded"
                  required
                />
              </label>
              <label>
                State of Issue
                <input
                  name="stateOfIssue"
                  className="block border px-2 py-1 w-full rounded"
                  required
                />
              </label>
              <label>
                Expiry Date
                <input
                  type="date"
                  name="licenseExpiry"
                  className="block border px-2 py-1 w-full rounded"
                  required
                />
              </label>

              {isMobile ? (
                <WebcamCapture
                  label="DriverLicense"
                  onCapture={(file) => setLicenseFile(file)}
                />
              ) : (
                <>
                  <input
                    type="file"
                    id="driverLicensePhoto"
                    name="driverLicensePhoto"
                    accept="image/*"
                    className="sr-only inline-block m-10"
                  />
                  <label
                    htmlFor="driverLicensePhoto"
                    className="mt-4 px-4 py-2 bg-gray-300 rounded inline-block hover:cursor-pointer"
                  >
                    Upload a photo of the front of your driver's license
                  </label>

                  <div>
                    <p className="font-medium">Take a selfie holding your ID</p>
                    <WebcamCapture
                      label="SelfieWithID"
                      onCapture={(file) => setSelfieFile(file)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          {selfieFile && (
            <input
              type="hidden"
              name="selfieWithId"
              value="captured"
              data-testid="selfie-input"
            />
          )}

          <button
            type="submit"
            className="mt-6 bg-blue-500 text-white py-2 px-6 rounded font-semibold hover:cursor-pointer"
          >
            Submit
          </button>
        </form>
      </section>
      {errorMessage && (
        <ErrorModal
          errorMessage={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
}
