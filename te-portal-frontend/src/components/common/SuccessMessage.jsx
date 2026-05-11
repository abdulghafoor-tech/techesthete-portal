import React from 'react';
import { CheckCircle, X } from 'lucide-react';

const SuccessMessage = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-start gap-3">
      <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:bg-green-200 p-1 rounded transition"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SuccessMessage;