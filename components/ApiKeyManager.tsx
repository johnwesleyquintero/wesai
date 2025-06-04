import React, { useState, useEffect } from 'react';
import { ThemeToggleButton } from './ThemeToggleButton';
import { FaGithub } from 'react-icons/fa';

interface ApiKeyManagerProps {
  onSaveKey: (key: string) => void;
  onRemoveKey: () => void;
  isKeySet: boolean;
  currentKeySource: 'ui' | 'env' | 'none';
  onLogout?: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  onSaveKey,
  onRemoveKey,
  isKeySet,
  currentKeySource,
  onLogout,
  theme,
  toggleTheme,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showSavedMessage, setShowSavedMessage] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(!isKeySet);

  useEffect(() => {
    // Auto-collapse if a key gets set (e.g. from env) and it was expanded due to no key
    if (isKeySet && isExpanded && currentKeySource !== 'none') {
      const initiallyExpandedDueToNoKey =
        !localStorage.getItem('geminiApiKey') &&
        !(typeof import.meta.env !== 'undefined' && import.meta.env.VITE_GEMINI_API_KEY);
      if (initiallyExpandedDueToNoKey) {
        // This effect is tricky. Simpler to just let user manage expansion or default to collapsed if key is set.
      }
    }
    // Default expansion state based on key presence
    setIsExpanded(!isKeySet);
  }, [isKeySet, currentKeySource]);

  const handleSave = () => {
    if (apiKeyInput.trim()) {
      onSaveKey(apiKeyInput);
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 3000);
      setIsExpanded(false);
    }
  };

  const handleRemove = () => {
    const confirmationMessage =
      'Are you sure you want to remove the API key? This will clear the currently saved key and any generated content (reviews, refactors, images, chat history) from this session. The application will then attempt to use an environment variable key if available. If no key is active, features will be disabled.';
    if (window.confirm(confirmationMessage)) {
      onRemoveKey();
      setApiKeyInput('');
      setIsExpanded(true);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 shadow-xl rounded-lg p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mr-2">
            Manage Gemini API Key
          </h2>
          <button
            onClick={toggleExpand}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            aria-expanded={isExpanded}
            aria-controls="apiKeyFormSection"
          >
            {isExpanded ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            )}
            <span className="sr-only">
              {isExpanded ? 'Collapse API Key Form' : 'Expand API Key Form'}
            </span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href="https://github.com/johnwesleyquintero/wesai"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="text-purple-500 hover:text-purple-700 text-2xl"
          >
            <FaGithub />
          </a>
          <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
          {onLogout && (
            <button
              onClick={onLogout}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md text-sm transition duration-150 ease-in-out whitespace-nowrap"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div id="apiKeyFormSection" className="space-y-4 pt-2">
          <div className="space-y-2">
            <label
              htmlFor="apiKeyInput"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Enter your Gemini API Key:
            </label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="password"
                id="apiKeyInput"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={isKeySet ? 'Enter new key to override' : 'Your Gemini API Key'}
                className="flex-grow p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 font-mono text-sm"
              />
              <button
                onClick={handleSave}
                disabled={!apiKeyInput.trim()}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Save Key
              </button>
              {isKeySet && (
                <button
                  onClick={handleRemove}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out whitespace-nowrap"
                >
                  Remove Key
                </button>
              )}
            </div>
          </div>

          {showSavedMessage && (
            <p className="text-sm text-green-500 dark:text-green-400">
              API Key saved successfully!
            </p>
          )}

          {!isKeySet && currentKeySource === 'none' && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              No API key is currently active. Please enter and save your key to use the application.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
