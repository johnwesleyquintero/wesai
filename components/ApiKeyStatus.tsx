
import React, { useState } from 'react';

interface ApiKeyStatusProps {
  apiKeyIsSet: boolean;
  apiKeySource: 'ui' | 'env' | 'none';
}

export const ApiKeyStatus: React.FC<ApiKeyStatusProps> = ({ apiKeyIsSet, apiKeySource }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  let statusMessage = '';
  let baseBgColor = 'bg-yellow-100 dark:bg-yellow-700/30';
  let baseBorderColor = 'border-yellow-400 dark:border-yellow-600';
  let baseTextColor = 'text-yellow-700 dark:text-yellow-200';
  let subTextColor = 'text-yellow-600 dark:text-yellow-300';
  let securityNoteColor = 'text-orange-600 dark:text-orange-300';


  if (apiKeyIsSet) {
    baseBgColor = 'bg-green-100 dark:bg-green-700/30';
    baseBorderColor = 'border-green-400 dark:border-green-600';
    baseTextColor = 'text-green-700 dark:text-green-200';
    subTextColor = 'text-green-600 dark:text-green-300';
    if (apiKeySource === 'ui') {
      statusMessage = 'API Key Status: Configured (from browser storage) and ready.';
    } else if (apiKeySource === 'env') {
      statusMessage = 'API Key Status: Configured (from environment variables) and ready.';
    }
  } else {
    statusMessage = 'API Key Status: Not Detected.';
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`${baseBgColor} border ${baseBorderColor} ${baseTextColor} px-4 py-3 rounded-md text-sm`} role={apiKeyIsSet ? "status" : "alert"}>
      <div className="flex justify-between items-center">
        <strong className="font-semibold flex-grow">{statusMessage}</strong>
        <button 
          onClick={toggleExpand} 
          className="text-current opacity-70 hover:opacity-100 ml-2 p-1 rounded-full focus:outline-none focus:ring-1 focus:ring-current"
          aria-expanded={isExpanded}
          aria-controls="apiKeyStatusDetailsSection"
        >
          {isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          )}
          <span className="sr-only">{isExpanded ? "Collapse API Key Status Details" : "Expand API Key Status Details"}</span>
        </button>
      </div>

      {isExpanded && (
        <div id="apiKeyStatusDetailsSection" className="mt-2 space-y-1 text-xs">
          {!apiKeyIsSet && (
            <p className={`${subTextColor} mt-1`}>
              Please enter your Gemini API key in the section above to enable code analysis features.
            </p>
          )}
          {apiKeyIsSet && apiKeySource === 'env' && (
            <p className={`${subTextColor} mt-1`}>
              You can override this by setting a key in the UI.
            </p>
          )}
          <p className={`${securityNoteColor} mt-2`}>
            <strong className="font-medium">Security Note:</strong> Storing API keys in browser local storage is convenient for client-side tools but can be a security risk if the site is vulnerable to XSS attacks. For production applications, API keys should ideally be managed on a secure backend server.
          </p>
        </div>
      )}
    </div>
  );
};
