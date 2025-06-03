
import React from 'react';
import { ThemeToggleButton } from './ThemeToggleButton.tsx'; // Assuming ThemeToggleButton is in the same directory

interface HeaderProps {
  title: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, theme, toggleTheme }) => {
  return (
    <header className="text-center relative py-4">
      <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 py-2">
        {title}
      </h1>
      <div className="absolute top-1/2 right-0 sm:right-2 md:right-4 transform -translate-y-1/2">
        <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
};