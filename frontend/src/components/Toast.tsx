import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  onClose: () => void;
  durationMs?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, durationMs = 2500 }) => {
  useEffect(() => {
    const id = setTimeout(onClose, durationMs);
    return () => clearTimeout(id);
  }, [onClose, durationMs]);

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center justify-between">
        <span>{message}</span>
        <button
          aria-label="Close"
          onClick={onClose}
          className="ml-3 text-white/80 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
};


