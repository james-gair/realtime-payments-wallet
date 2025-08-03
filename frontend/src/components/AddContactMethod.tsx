interface AddContactMethodProps {
  onMethodSelect: (method: 'payid' | 'account' | 'bank-account') => void;
  onCancel: () => void;
}

export function AddContactMethod({ onMethodSelect, onCancel }: AddContactMethodProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-md mx-auto">
      {/* Header */}
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
        <h1 className="text-2xl font-bold text-gray-900">Add a recipient</h1>
      </div>

      {/* Method Options */}
      <div className="space-y-4">
        {/* PayID Option */}
        <button
          onClick={() => onMethodSelect('payid')}
          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">PayID</h3>
              <p className="text-sm text-gray-600">Find by phone number or email</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Account Option */}
        <button
          onClick={() => onMethodSelect('account')}
          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Find on SendIt</h3>
              <p className="text-sm text-gray-600">Search by @username, email or mobile number</p>
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  <span className="mr-1">😊</span>
                  Instant and convenient
                </span>
              </div>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Bank Account Option */}
        <button
          onClick={() => onMethodSelect('bank-account')}
          className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Bank details</h3>
              <p className="text-sm text-gray-600">Enter name, BSB code and account number</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* See all options button */}
      <div className="mt-8 text-center">
        <button className="inline-flex items-center px-4 py-2 bg-black hover:bg-zinc-800 text-white rounded-lg transition-colors font-semibold">
          <span>See all options</span>
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
} 