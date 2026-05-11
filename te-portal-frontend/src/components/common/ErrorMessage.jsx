import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative flex items-start gap-3">
      <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-red-200 p-1 rounded transition"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
