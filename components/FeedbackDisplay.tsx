import React, { useState, useCallback } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FeedbackDisplayProps {
  feedback: string;
}

interface CustomCodeRendererProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

export const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(feedback || ''); // Ensure string for clipboard
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy feedback: ', err);
    }
  }, [feedback]);

  return (
    <div className="bg-gray-50 dark:bg-gray-700 p-4 md:p-6 rounded-lg shadow-inner relative">
      <button
        onClick={handleCopy}
        title={isCopied ? 'Copied!' : 'Copy feedback'}
        aria-label={isCopied ? 'Feedback copied to clipboard' : 'Copy feedback to clipboard'}
        className={`absolute top-3 right-3 p-2 rounded-md transition-colors duration-150 ease-in-out
                    ${
                      isCopied
                        ? 'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-300 dark:hover:text-gray-100'
                    }`}
      >
        {isCopied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
            />
          </svg>
        )}
        <span className="sr-only">{isCopied ? 'Copied!' : 'Copy'}</span>
      </button>
      <div
        className="prose prose-sm sm:prose-base max-w-none dark:prose-invert 
                      prose-headings:text-slate-800 dark:prose-headings:text-slate-200 
                      prose-p:text-slate-700 dark:prose-p:text-slate-300 
                      prose-li:text-slate-700 dark:prose-li:text-slate-300
                      prose-strong:text-slate-900 dark:prose-strong:text-slate-100 
                      prose-code:text-pink-600 dark:prose-code:text-pink-400 
                      prose-code:bg-slate-100 dark:prose-code:bg-slate-700 
                      prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded 
                      prose-pre:bg-slate-100 dark:prose-pre:bg-slate-700 
                      prose-pre:p-4 prose-pre:rounded-md 
                      prose-pre:text-slate-800 dark:prose-pre:text-slate-200
                      pt-8 sm:pt-4"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={
            {
              code: ({ node, inline, className, children, ...rest }: CustomCodeRendererProps) => {
                if (!inline) {
                  return (
                    <code className={`${className || ''} break-words`} {...rest}>
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className} {...rest}>
                    {children}
                  </code>
                );
              },
            } as Components
          }
        >
          {feedback || ''}
        </ReactMarkdown>
      </div>
    </div>
  );
};
