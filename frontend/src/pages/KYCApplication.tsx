export function KYCApplication() {
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

        <form className="mt-6 space-y-6" aria-labelledby="kyc-section-heading">
          <div>
            <label htmlFor="fullName" className="block font-medium">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="w-full border px-3 py-2 rounded"
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
            />
          </div>

          <fieldset className="border rounded p-4">
            <legend className="font-semibold flex items-center gap-2">
              <input type="checkbox" id="driverLicense" name="driverLicense" />
              <label htmlFor="driverLicense">Driver’s License</label>
            </legend>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="licenseNumber" className="block font-medium">
                  License Number
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label htmlFor="stateOfIssue" className="block font-medium">
                  State of Issue
                </label>
                <input
                  type="text"
                  id="stateOfIssue"
                  name="stateOfIssue"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label htmlFor="licenseExpiry" className="block font-medium">
                  Expiry Date
                </label>
                <input
                  type="date"
                  id="licenseExpiry"
                  name="licenseExpiry"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <button
                type="button"
                className="mt-2 px-4 py-2 bg-gray-300 rounded"
              >
                Upload a photo of the front of the license
              </button>
            </div>
          </fieldset>

          <fieldset className="border rounded p-4">
            <legend className="font-semibold flex items-center gap-2">
              <input type="checkbox" id="passport" name="passport" />
              <label htmlFor="passport">Passport</label>
            </legend>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="passportNumber" className="block font-medium">
                  Passport Number
                </label>
                <input
                  type="text"
                  id="passportNumber"
                  name="passportNumber"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label htmlFor="countryOfIssue" className="block font-medium">
                  Country of Issue
                </label>
                <input
                  type="text"
                  id="countryOfIssue"
                  name="countryOfIssue"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label htmlFor="passportExpiry" className="block font-medium">
                  Expiry Date
                </label>
                <input
                  type="date"
                  id="passportExpiry"
                  name="passportExpiry"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <button
                type="button"
                className="mt-2 px-4 py-2 bg-gray-300 rounded"
              >
                Upload a photo of the front of the passport
              </button>
            </div>
          </fieldset>

          <button
            type="submit"
            className="mt-6 bg-blue-500 text-white py-2 px-6 rounded font-semibold"
          >
            Confirm
          </button>
        </form>
      </section>
    </div>
  );
}
