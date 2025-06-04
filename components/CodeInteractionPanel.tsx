import React from 'react';
import { CodeInput } from './CodeInput.tsx';
import { FeedbackDisplay } from './FeedbackDisplay.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface CodeInteractionPanelProps {
  activeTab: 'review' | 'refactor' | 'preview' | 'generate' | 'content';
  code: string; // Used for code input or content description
  onCodeChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClearInput: () => void; // New prop for clearing input
  onSubmit: () => void;
  isLoading: boolean;
  isApiKeyConfigured: boolean;
  feedback: string;
  error: string | null;
  setError: (error: string | null) => void;
}

// Helper function to parse refactor feedback based on expected markdown structure
const parseRefactorFeedback = (
  feedback: string,
): { summary: string | null; refactoredCode: string | null } => {
  // Regex to find the summary section between "## Refactoring Summary:\n" and the next heading or end of string
  const summaryMatch = feedback.match(
    /## Refactoring Summary:\n([\s\S]*?)(?=\n## Refactored Code:|$)/,
  );
  // Regex to find the code block section after "## Refactored Code:\n"
  const codeMatch = feedback.match(
    /## Refactored Code:\n```(?:typescript|tsx|javascript|js|jsx)\n([\s\S]*?)\n```/,
  );

  const summary = summaryMatch ? summaryMatch[1].trim() : null;
  const refactoredCode = codeMatch ? codeMatch[1].trim() : null;

  return { summary, refactoredCode };
};

export const CodeInteractionPanel: React.FC<CodeInteractionPanelProps> = ({
  activeTab,
  code,
  onCodeChange,
  onClearInput,
  onSubmit,
  isLoading,
  isApiKeyConfigured,
  feedback,
  error,
  setError,
}) => {
  const [parsedRefactorFeedback, setParsedRefactorFeedback] = React.useState<{
    summary: string | null;
    refactoredCode: string | null;
  }>({ summary: null, refactoredCode: null });

  // Effect to parse feedback when it changes, but only for the refactor tab
  React.useEffect(() => {
    if (feedback && activeTab === 'refactor') {
      setParsedRefactorFeedback(parseRefactorFeedback(feedback));
    } else {
      // Clear parsed feedback if tab changes or feedback is cleared
      setParsedRefactorFeedback({ summary: null, refactoredCode: null });
    }
  }, [feedback, activeTab]);

  const getActionVerb = (): string => {
    if (activeTab === 'review') return 'review';
    if (activeTab === 'refactor') return 'refactor';
    if (activeTab === 'preview') return 'get a preview for';
    if (activeTab === 'generate') return 'generate code based on';
    if (activeTab === 'content') return 'create';
    return 'process';
  };

  const getButtonText = (): string => {
    if (isLoading) {
      if (activeTab === 'review') return 'Reviewing...';
      if (activeTab === 'refactor') return 'Refactoring...';
      if (activeTab === 'preview') return 'Generating Preview...';
      if (activeTab === 'generate') return 'Generating Code...';
      if (activeTab === 'content') return 'Creating...';
    } else {
      if (activeTab === 'review') return 'Review Code';
      if (activeTab === 'refactor') return 'Refactor Code';
      if (activeTab === 'preview') return 'Get Component Preview';
      if (activeTab === 'generate') return 'Generate Code';
      if (activeTab === 'content') return 'Create Content';
    }
    return 'Submit';
  };

  const getFeedbackTitle = (): string => {
    if (activeTab === 'review') return 'Review Feedback:';
    if (activeTab === 'refactor') return 'Refactoring Result:';
    if (activeTab === 'preview') return 'Component Preview:';
    if (activeTab === 'generate') return 'Generated Code:';
    if (activeTab === 'content') return 'Generated Content:';
    return 'Result:';
  };

  const getLoadingMessage = (): string => {
    if (activeTab === 'review') return 'Generating review, please wait...';
    if (activeTab === 'refactor') return 'Generating refactoring results, please wait...';
    if (activeTab === 'preview') return 'Generating preview description, please wait...';
    if (activeTab === 'generate') return 'Generating your code, please wait...';
    if (activeTab === 'content') return 'Generating content, please wait...';
    return 'Processing, please wait...';
  };

  const getInputPlaceholder = (): string => {
    if (activeTab === 'generate')
      return "Describe the code you want to generate (e.g., 'a React component that fetches and displays a list of users', or 'a TypeScript function to sort an array by a property')...";
    if (activeTab === 'content')
      return "Describe the content you want to create (e.g., 'a short blog post about AI ethics', 'a tweet announcing a new product feature', 'an outline for a documentation page on user authentication')...";
    return 'Paste your code here...';
  };

  const getInputLabel = (): string => {
    if (activeTab === 'generate') return `Describe the code you want to ${getActionVerb()}:`;
    if (activeTab === 'content') return `Describe the content you want to ${getActionVerb()}:`;
    return `Enter React/TypeScript component code to ${getActionVerb()}:`;
  };

  const handleSubmitClick = React.useCallback(() => {
    if (!isApiKeyConfigured) {
      setError(
        'Gemini API key is not configured. Please set it in the API Key Management section.',
      );
      return;
    }
    if (activeTab !== 'generate' && activeTab !== 'content' && !code.trim()) {
      setError(`Please enter some code to ${getActionVerb()}.`);
      return;
    }
    if ((activeTab === 'generate' || activeTab === 'content') && !code.trim()) {
      setError(`Please enter a description to ${getActionVerb()}.`);
      return;
    }
    setError(null);
    onSubmit();
  }, [activeTab, code, isApiKeyConfigured, setError, onSubmit, getActionVerb]);

  // Helper function to render the feedback section based on activeTab and parsed data
  const renderFeedback = () => {
    if (!feedback || isLoading) {
      return null; // Don't show feedback if loading or no feedback is present
    }

    const feedbackTitle = getFeedbackTitle();

    if (activeTab === 'refactor') {
      const { summary, refactoredCode } = parsedRefactorFeedback;

      // If neither summary nor code were successfully parsed, show the raw feedback
      if (!summary && !refactoredCode) {
        return (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
              {feedbackTitle} (Could not parse structured output)
            </h2>
            <FeedbackDisplay feedback={feedback} />
          </div>
        );
      }

      // Show structured feedback if parsed successfully
      return (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
            {feedbackTitle}
          </h2>
          {summary && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Refactoring Summary:
              </h3>
              <FeedbackDisplay feedback={summary} />
            </div>
          )}
          {refactoredCode && (
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Refactored Code:
              </h3>
              {/* Wrap code in markdown code block format for FeedbackDisplay */}
              <FeedbackDisplay feedback={`\`\`\`typescript\n${refactoredCode}\n\`\`\``} />
            </div>
          )}
        </div>
      );
    } else {
      // Display raw feedback for all other tabs
      return (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
            {feedbackTitle}
          </h2>
          <FeedbackDisplay feedback={feedback} />
        </div>
      );
    }
  };

  return (
    <>
      {/* Input Section */}
      <div className="relative">
        <label
          htmlFor="codeInput"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {getInputLabel()}
        </label>
        <CodeInput
          value={code}
          onChange={onCodeChange}
          disabled={isLoading || !isApiKeyConfigured}
          placeholder={getInputPlaceholder()}
        />
        {code && !isLoading && (
          <button
            onClick={onClearInput}
            title="Clear input"
            aria-label="Clear input field"
            className="absolute top-8 right-2 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmitClick}
        disabled={isLoading || !isApiKeyConfigured || !code.trim()}
        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading && <LoadingSpinner />}
        {getButtonText()}
      </button>

      {/* Error Message */}
      {error && (
        <div
          className="mt-4 p-4 bg-red-100 dark:bg-red-700/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md shadow"
          role="alert"
        >
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      {/* Loading State Display */}
      {isLoading && (
        <div className="mt-6 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg shadow-md">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600 dark:text-gray-300">{getLoadingMessage()}</p>
        </div>
      )}

      {/* Feedback Display (rendered by the helper function) */}
      {!isLoading && renderFeedback()}
    </>
  );
};
