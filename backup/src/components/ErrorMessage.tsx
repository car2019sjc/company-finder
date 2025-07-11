import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onClose: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onClose }) => {
  const getErrorSuggestion = (message: string) => {
    if (message.includes('API key')) {
      return 'Please check that your Apollo.io API key is correct and has the necessary permissions.';
    }
    if (message.includes('connect') || message.includes('fetch')) {
      return 'Please check your internet connection and try again.';
    }
    if (message.includes('401')) {
      return 'Your API key appears to be invalid. Please check your Apollo.io account settings.';
    }
    if (message.includes('403')) {
      return 'Access denied. Please ensure your Apollo.io plan includes API access.';
    }
    if (message.includes('429')) {
      return 'Rate limit exceeded. Please wait a moment before trying again.';
    }
    return 'Please try again or contact support if the problem persists.';
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
        <div className="flex-1">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 text-sm mt-1">{message}</p>
          <p className="text-red-600 text-xs mt-2 italic">
            {getErrorSuggestion(message)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-600 ml-4"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};