import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onClear?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClear }) => {
  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-xl max-w-md z-50" role="alert">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg mb-1">Ocorreu um Erro</h3>
          <p className="text-sm">{message}</p>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="ml-4 p-1 -mt-1 -mr-1 text-red-100 hover:text-white transition-colors rounded-full hover:bg-red-600"
            aria-label="Fechar erro"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;