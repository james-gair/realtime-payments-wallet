import type { ModalProps } from "../types";

export function Modal({ modalName, displayMessage, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 h-full">
      <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-2">{modalName}</h2>
        <p className="text-sm text-gray-700">{displayMessage}</p>
        <button
          onClick={onClose}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
