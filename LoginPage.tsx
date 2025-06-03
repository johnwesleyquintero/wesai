
import React, { useState } from 'react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  currentTheme?: 'light' | 'dark'; // Optional, as body will handle global theme
}

const HARDCODED_PASSWORD = 'wesai_rocks'; 

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, currentTheme }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === HARDCODED_PASSWORD) {
      setError('');
      onLoginSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  // The outer div's theme is handled by the body tag via App.tsx theme management
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-gray-100 dark:bg-gray-800 shadow-2xl rounded-lg p-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 py-2">
            WesAI Code Assistant
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Please log in to continue</p>
        </header>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center" role="alert">{error}</p>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition duration-150"
            >
              Log In
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          This is a simplified client-side login for demonstration and to protect API key usage. <br /> The password is hardcoded and not suitable for production security.
        </p>
      </div>
    </div>
  );
};
