import { useState } from "react";
import { auth } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import { WebcamCapture } from "../components/WebcameCapture";

// TODO: Selfie Capture and error handling

export function KYCApplication() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const [idType, setIdType] = useState<"passport" | "driverLicense" | "">("");

  const handleConfirm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    console.log(selfieFile);
    console.log(licenseFile);

    // Input fileds check:
    // Either passport or driver's license should be selected
    if (idType === "") {
      alert("Please select an ID type");
      return;
    }

    if (!selfieFile) {
      alert("Please upload a selfie photo with ID.");
      return;
    }
    formData.append("selfieWithId", selfieFile);

    const licencephoto =
      licenseFile ||
      formData.get("passportPhoto") ||
      formData.get("driverLicensePhoto");

    if (!licencephoto) {
      alert("Please upload the ID photo");
      return;
    }
    // All the fields under the selected ID type should be filled out
    if (idType === "passport") {
      const passportNumber = formData.get("passportNumber")?.toString().trim();
      const countryOfIssue = formData.get("countryOfIssue")?.toString().trim();
      const passportExpiry = formData.get("passportExpiry")?.toString().trim();

      if (!passportNumber || !countryOfIssue || !passportExpiry) {
        alert("Please complete all passport fields.");
        return;
      }
    }

    if (idType === "driverLicense") {
      const licenseNumber = formData.get("licenseNumber")?.toString().trim();
      const stateOfIssue = formData.get("stateOfIssue")?.toString().trim();
      const licenseExpiry = formData.get("licenseExpiry")?.toString().trim();

      if (!licenseNumber || !stateOfIssue || !licenseExpiry) {
        alert("Please complete all driver's license fields.");
        return;
      }
    }

    const user = auth.currentUser;
    if (!user) throw new Error("not authenticated");

    const idToken = await user.getIdToken();
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }
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
        alert(`Error ${res.status}: ${data.error}`);
        console.error("Issues:", data.issues);
        return;
      }
      // Verification successful, inform the user and then redirect to dashboard
      navigate("/kyc/success");
    } catch (err) {
      console.error("Network error", err);
      alert("Something went wrong. Please try again later.");
      return;
    }
  };

  return (
    <div className="m-10 bg-white">
      <section aria-labelledby="kyc-section-heading">
        <h2 id="kyc-section-heading" className="text-lg font-semibold">
          Before you can transfer money into your wallet, we need to verify your
          identity.
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
                  value="drivers_license" // complies with the id check api
                  checked={idType === "driverLicense"}
                  onChange={() => setIdType("driverLicense")}
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
                    required
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

          {idType === "driverLicense" && (
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
                    required
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

          <button
            type="submit"
            className="mt-6 bg-blue-500 text-white py-2 px-6 rounded font-semibold hover:cursor-pointer"
          >
            Sibmit
          </button>
        </form>
      </section>
    </div>
  );
}
