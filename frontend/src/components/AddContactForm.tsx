import { useState } from "react";
import { authFetch } from "../services/firebaseFetch";

type ContactType = 'account' | 'payid' | 'bank-account';

interface AddContactFormProps {
  method: ContactType;
  onSuccess: (contact?: any) => void;
  onCancel: () => void;
}

export function AddContactForm({ method, onSuccess, onCancel }: AddContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search fields
  const [searchValue, setSearchValue] = useState('');

  // Bank account form fields
  const [bsb, setBsb] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [bankCountry, setBankCountry] = useState<'AU' | 'US' | 'JP'>('AU');
  const [jpBankCode, setJpBankCode] = useState('');
  const [jpBranchCode, setJpBranchCode] = useState('');

  // Common fields
  const [nickname, setNickname] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let requestData: any = {
        nickname: nickname.trim() || undefined
      };

      switch (method) {
        case 'account':
          if (!searchValue.trim()) {
            setError('Please enter a username, phone number, or email');
            return;
          }
          requestData = {
            type: 'account',
            searchValue: searchValue.trim(),
            nickname: nickname.trim() || undefined
          };
          break;

        case 'payid':
          if (!searchValue.trim()) {
            setError('PayID is required');
            return;
          }
          requestData = {
            type: 'payid',
            payid: searchValue.trim(),
            nickname: nickname.trim() || undefined
          };
          break;

        case 'bank-account':
          if (bankCountry === 'AU' && !bsb.trim()) {
            setError('BSB is required for Australian bank accounts');
            return;
          }
          if (bankCountry === 'US' && !routingNumber.trim()) {
            setError('Routing number is required for US bank accounts');
            return;
          }
          if (bankCountry === 'JP' && (!jpBankCode.trim() || !jpBranchCode.trim())) {
            setError('Bank code and branch code are required for Japan bank accounts');
            return;
          }
          if (!accountNumber.trim()) {
            setError('Account number is required');
            return;
          }
          if (!accountHolderName.trim()) {
            setError('Account holder name is required');
            return;
          }
          requestData = {
            type: 'bank_account',
            country: bankCountry,
            ...(bankCountry === 'AU' ? { bsb: bsb.trim() }
              : bankCountry === 'US' ? { routingNumber: routingNumber.trim() }
              : { bankCode: jpBankCode.trim(), branchCode: jpBranchCode.trim() }
            ),
            accountNumber: accountNumber.trim(),
            accountHolderName: accountHolderName.trim(),
            accountEmail: accountEmail.trim() || undefined,
            nickname: nickname.trim() || undefined
          };
          break;
      }

      const response = await authFetch("http://localhost:4000/api/saved-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add contact");
      }

      const result = await response.json();
      setSuccess(`Contact "${result.name}" added successfully!`);
      
      // Reset form
      setSearchValue('');
      setBsb('');
      setRoutingNumber('');
      setAccountNumber('');
      setAccountHolderName('');
              setAccountEmail('');
              setJpBankCode('');
              setJpBranchCode('');
      setNickname('');
      setBankCountry('AU');

      // Call success callback with the new contact after a delay
      setTimeout(() => {
        onSuccess(result);
      }, 2000);

    } catch (err: any) {
      setError(err.message || "Failed to add contact");
    } finally {
      setLoading(false);
    }
  };



  const renderHeader = () => {
    switch (method) {
      case 'payid':
        return (
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">D</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Find people on PayID</h1>
            <p className="text-gray-600 mt-2">Enter phone number or email</p>
          </div>
        );
      case 'account':
        return (
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Find people on SendIt</h1>
            <p className="text-gray-600 mt-2">Enter @username, email or phone number</p>
          </div>
        );
      case 'bank-account':
        return (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Enter their account details</h1>
            <p className="text-gray-600 mt-2">Recipient's bank details</p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderForm = () => {
    switch (method) {
      case 'payid':
        return (
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Phone number or email"
              />
            </div>
          </div>
        );
      case 'account':
        return (
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="@username, email, phone number"
              />
            </div>
          </div>
        );
      case 'bank-account':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={bankCountry}
                onChange={(e) => setBankCountry(e.target.value as 'AU' | 'US' | 'JP')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
              >
                <option value="AU">Australia</option>
                <option value="US">United States</option>
                <option value="JP">Japan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Their email (optional)
              </label>
              <input
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="example@example.ex"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full name of the account holder
              </label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="Enter full name"
              />
            </div>
            {bankCountry === 'AU' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BSB code
                </label>
                <input
                  type="text"
                  value={bsb}
                  onChange={(e) => setBsb(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="802985"
                  maxLength={6}
                />
              </div>
            ) : bankCountry === 'US' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing number
                </label>
                <input
                  type="text"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="021000021"
                  maxLength={9}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank code
                  </label>
                  <input
                    type="text"
                    value={jpBankCode}
                    onChange={(e) => setJpBankCode(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="0001"
                    maxLength={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch code
                  </label>
                  <input
                    type="text"
                    value={jpBranchCode}
                    onChange={(e) => setJpBranchCode(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="001"
                    maxLength={3}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder={bankCountry === 'AU' ? "12345678" : bankCountry === 'US' ? "1234567890" : "1234567"}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto">
      {/* Header with Back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={onCancel}
          className="flex items-center text-black hover:text-zinc-700 mr-4"
        >
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="underline">Back</span>
        </button>
      </div>

      {renderHeader()}

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderForm()}

        {/* Nickname Field */}
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
            Nickname (Optional)
          </label>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            placeholder="Enter a nickname for this contact"
            maxLength={50}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-black hover:bg-zinc-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all"
        >
          {loading ? 'Adding...' : 'Continue'}
        </button>
      </form>
    </div>
  );
} 