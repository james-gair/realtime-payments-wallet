import { useState } from "react";
import { auth } from "../services/firebase";

// TODO: Selfie Capture and error handling

export function KYCApplication() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [idType, setIdType] = useState<"passport" | "driverLicense" | "">("");
  const handleConfirm = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // Input fileds check:
    // Either passport or driver's license should be selected
    if (idType === "") {
      alert("Please select an ID type");
    }
    // All the fields under the selected ID type should be filled out
    if (idType === "passport") {
      const passportNumber = formData.get("passportNumber")?.toString().trim();
      const countryOfIssue = formData.get("countryOfIssue")?.toString().trim();
      const passportExpiry = formData.get("passportExpiry")?.toString().trim();
      const passportPhoto = formData.get("passportPhoto");

      if (
        !passportNumber ||
        !countryOfIssue ||
        !passportExpiry ||
        !passportPhoto
      ) {
        alert("Please complete all passport fields and upload a photo.");
        return;
      }
    }

    if (idType === "driverLicense") {
      const licenseNumber = formData.get("licenseNumber")?.toString().trim();
      const stateOfIssue = formData.get("stateOfIssue")?.toString().trim();
      const licenseExpiry = formData.get("licenseExpiry")?.toString().trim();
      const licensePhoto = formData.get("driverLicensePhoto");

      if (!licenseNumber || !stateOfIssue || !licenseExpiry || !licensePhoto) {
        alert(
          "Please complete all driver's license fields and upload a photo."
        );
        return;
      }
    }

    fetch(backendUrl + "/api/kyc", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Success:", data);
      });

    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    console.log("UID: " + auth.currentUser?.uid);
    console.log("email: " + auth.currentUser?.email);
    console.log(backendUrl);
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
                Upload a photo of the front of the passport
              </label>
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
