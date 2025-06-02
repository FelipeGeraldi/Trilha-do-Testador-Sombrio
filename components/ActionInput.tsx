
import React, { useState } from 'react';

interface ActionInputProps {
  onActionSubmit: (action: string) => void;
  disabled?: boolean;
}

const ActionInput: React.FC<ActionInputProps> = ({ onActionSubmit, disabled }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onActionSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center p-2 bg-gray-800 rounded-lg shadow-md">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="O que você faz?"
        disabled={disabled}
        className="flex-grow p-3 bg-gray-700 text-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none placeholder-gray-500 disabled:opacity-50"
        aria-label="Digite sua ação"
      />
      <button
        type="submit"
        disabled={disabled || !inputValue.trim()}
        className="px-5 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Enviar
      </button>
    </form>
  );
};

export default ActionInput;
