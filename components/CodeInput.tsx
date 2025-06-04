import React from 'react';

interface CodeInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const CodeInput: React.FC<CodeInputProps> = ({ value, onChange, disabled, placeholder }) => {
  return (
    <textarea
      id="codeInput"
      value={value}
      onChange={onChange}
      disabled={disabled}
      rows={15}
      className="w-full p-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 font-mono text-sm transition-colors duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
      placeholder={placeholder}
    />
  );
};
