import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner.tsx';

interface ImageGenerationPanelProps {
  prompt: string;
  onPromptChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onClearPrompt: () => void; // New prop for clearing prompt
  onSubmit: () => void;
  isLoading: boolean;
  isApiKeyConfigured: boolean;
  imageData: string | null; // Base64 encoded image data
  error: string | null;
  setError: (error: string | null) => void;
}

export const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({
  prompt,
  onPromptChange,
  onClearPrompt,
  onSubmit,
  isLoading,
  isApiKeyConfigured,
  imageData,
  error,
  setError,
}) => {
  const [downloadName, setDownloadName] = useState('generated-image.jpg');

  const handleDownload = () => {
    if (!imageData) return;
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${imageData}`;
    link.download =
      downloadName.endsWith('.jpg') || downloadName.endsWith('.jpeg')
        ? downloadName
        : `${downloadName}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitClick = () => {
    if (!isApiKeyConfigured) {
      setError(
        'Gemini API key is not configured. Please set it in the API Key Management section.',
      );
      return;
    }
    if (!prompt.trim()) {
      setError('Please enter a description for the image.');
      return;
    }
    setError(null);
    const newDownloadName =
      prompt
        .substring(0, 30)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase() || 'generated_image';
    setDownloadName(`${newDownloadName}.jpg`);
    onSubmit();
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <label
          htmlFor="imagePromptInput"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Describe the image you want to create:
        </label>
        <textarea
          id="imagePromptInput"
          value={prompt}
          onChange={onPromptChange}
          disabled={isLoading || !isApiKeyConfigured}
          rows={3}
          className="w-full p-4 pr-10 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 font-mono text-sm transition-colors duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
          placeholder="e.g., 'A hyperrealistic portrait of a majestic lion in a snowy forest', 'A vibrant abstract painting with geometric shapes and bold colors', 'A cute robot waving hello'"
        />
        {prompt && !isLoading && (
          <button
            onClick={onClearPrompt}
            title="Clear prompt"
            aria-label="Clear image prompt"
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
      <button
        onClick={handleSubmitClick}
        disabled={isLoading || !isApiKeyConfigured || !prompt.trim()}
        className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading && <LoadingSpinner />}
        {isLoading ? 'Generating Image...' : 'Generate Image'}
      </button>

      {error && (
        <div
          className="mt-4 p-4 bg-red-100 dark:bg-red-700/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md shadow"
          role="alert"
        >
          <strong className="font-semibold">Error:</strong> {error}
        </div>
      )}

      {isLoading && !imageData && (
        <div className="mt-6 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg shadow-md">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Your image is being created by Imagen, please wait...
          </p>
        </div>
      )}

      {imageData && !isLoading && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
            Generated Image:
          </h2>
          <div className="flex flex-col items-center">
            <img
              src={`data:image/jpeg;base64,${imageData}`}
              alt={prompt || 'Generated image'}
              className="max-w-full h-auto rounded-md shadow-md border border-gray-300 dark:border-gray-600 mb-4"
              style={{ maxHeight: '60vh' }}
            />
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <input
                type="text"
                value={downloadName}
                onChange={(e) => setDownloadName(e.target.value)}
                placeholder="image_name.jpg"
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100 text-sm w-full sm:w-auto flex-grow"
                aria-label="Download file name"
              />
              <button
                onClick={handleDownload}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center justify-center whitespace-nowrap"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
