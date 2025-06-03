import { ThemeToggleButton } from './ThemeToggleButton'; // Assuming ThemeToggleButton is in the same directory and exported correctly
import { FaGithub } from 'react-icons/fa'; // Assuming react-icons/fa is installed and available

interface HeaderProps {
  title: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header = ({ title, theme, toggleTheme }: HeaderProps) => {
  return (
    <header className="text-center relative py-4">
      <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 py-2">
        {title}
      </h1>
      <div className="absolute top-1/2 right-0 sm:right-2 md:right-4 transform -translate-y-1/2 flex items-center">
        <a
          href="https://github.com/johnwesleyquintero/wesai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub Repository" // Added aria-label for accessibility
          className="mr-2 text-purple-500 hover:text-purple-700 text-2xl" // Adjusted classes for icon
        >
          <FaGithub />
        </a>
        <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
};