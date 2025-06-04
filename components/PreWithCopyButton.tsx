import React, { useState, useCallback, useRef } from 'react';

export const PreWithCopyButton: React.FC<React.HTMLAttributes<HTMLPreElement> & { node?: any }> = ({
  children,
  ...props
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const existingClassName = props.className || '';

  const onCopy = useCallback(() => {
    if (preRef.current) {
      const codeElement = preRef.current.querySelector('code');
      if (codeElement && codeElement.innerText) {
        navigator.clipboard
          .writeText(codeElement.innerText)
          .then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
          })
          .catch((err) => {
            console.error('Failed to copy documentation code: ', err);
          });
      }
    }
  }, []);

  return (
    <div className="relative group my-4">
      <button
        onClick={onCopy}
        title={isCopied ? 'Copied!' : 'Copy code'}
        aria-label={isCopied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
        className={`absolute top-2 right-2 p-1.5 rounded-md transition-all duration-150 ease-in-out 
                    opacity-0 group-hover:opacity-70 focus:opacity-100 hover:opacity-100
                    ${
                      isCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500'
                    }`}
      >
        {isCopied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
            />
          </svg>
        )}
        <span className="sr-only">{isCopied ? 'Copied!' : 'Copy code'}</span>
      </button>
      <pre {...props} ref={preRef} className={existingClassName}>
        {children}
      </pre>
    </div>
  );
};
