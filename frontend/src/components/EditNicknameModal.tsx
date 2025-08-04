import { useState, useEffect } from "react";
import type { Contact } from "../types";

interface EditNicknameModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactId: number, nickname: string | null) => Promise<void>;
}

export function EditNicknameModal({ contact, isOpen, onClose, onSave }: EditNicknameModalProps) {
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setNickname(contact.nickname || "");
      setError(null);
    }
  }, [contact]);

  const handleSave = async () => {
    if (!contact) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSave(contact.id, nickname.trim() || null);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update nickname");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNickname(contact?.nickname || "");
    setError(null);
    onClose();
  };

  if (!isOpen || !contact) return null;

  const mainLabel = contact.nickname && contact.nickname.trim().length > 0
    ? contact.nickname
    : contact.name;

  const subLabel = (() => {
    switch (contact.added_by) {
      case "username":
        return contact.username ? `@${contact.username}` : `@${contact.added_value}`;
      case "email":
      case "phone":
      case "bank_account":
        return contact.added_value;
      default:
        return "";
    }
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Contact
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contact Info */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg shadow-sm">
            {mainLabel.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-medium text-gray-900">{mainLabel}</div>
            <div className="text-sm text-gray-500">{subLabel}</div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
              Nickname
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter a nickname (optional)"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use the contact's name
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
} 