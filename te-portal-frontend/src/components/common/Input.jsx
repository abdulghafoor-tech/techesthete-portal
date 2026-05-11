import React from 'react';

const Input = ({ 
  type = 'text',
  name,  // ✅ CRITICAL: Must have name prop
  placeholder,
  value,
  onChange,  // ✅ CRITICAL: Must have onChange prop
  onKeyPress,
  disabled = false,
  className = '',
  error = null
}) => {
  return (
    <div className="w-full">
      <input
        type={type}
        name={name}  // ✅ Pass name to input element
        placeholder={placeholder}
        value={value}
        onChange={onChange}  // ✅ Pass onChange handler
        onKeyPress={onKeyPress}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 bg-white ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default Input;