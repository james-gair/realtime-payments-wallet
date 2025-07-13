import { useState } from "react";

function Profile() {
  // Example user data — replace with fetched user data
  const currentUser = {
    email: "alice@example.com",
    contact: "+1234567890",
    billingAddress: "123 E St, Sydney, NSW",
  };

  // States for new input
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone: string) =>
    /^(\+?\d{10,15})$/.test(phone);

  const handleSave = () => {
    setError("");
    setSuccess("");

    if (!email && !contact && !billingAddress) {
      setError("Please fill in at least one field to update.");
      return;
    }

    if (email && (email === currentUser.email || !isValidEmail(email))) {
      setError(
        email === currentUser.email
          ? "This is already your current email."
          : "Please enter a valid email address."
      );
      return;
    }

    if (
      contact &&
      (contact === currentUser.contact || !isValidPhone(contact))
    ) {
      setError(
        contact === currentUser.contact
          ? "This is already your current contact number."
          : "Please enter a valid contact number."
      );
      return;
    }

    if (billingAddress && billingAddress === currentUser.billingAddress) {
      setError("This is already your current billing address.");
      return;
    }

    // put  API calls 
    console.log("Saving profile:", { email, contact, billingAddress });
    setSuccess("Profile updated successfully!");
    setEmail("");
    setContact("");
    setBillingAddress("");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white rounded-xl shadow p-6 max-w-md w-full space-y-6">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Current: <span className="font-medium">{currentUser.email}</span>
          </p>
          <input
            type="email"
            placeholder="Enter new Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Current: <span className="font-medium">{currentUser.contact}</span>
          </p>
          <input
            type="tel"
            placeholder="Enter new Contact Number"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        {/* Billing Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Billing Address
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Current:{" "}
            <span className="font-medium">{currentUser.billingAddress}</span>
          </p>
          <input
            type="text"
            placeholder="Enter new Billing Address"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        {/* Error / Success Messages */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default Profile;