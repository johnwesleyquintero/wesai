import React from 'react';
import { ActiveTab } from '../types.ts';

interface TabNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const TABS: ActiveTab[] = ['review', 'refactor', 'preview', 'generate', 'content', 'image', 'chat', 'documentation'];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="mb-6 border-b border-gray-300 dark:border-gray-700 flex flex-wrap justify-center">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`py-3 px-4 sm:px-6 -mb-px font-medium text-sm sm:text-base border-b-2 transition-colors duration-150 ease-in-out
                      ${activeTab === tab
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'}`}
          aria-current={activeTab === tab ? 'page' : undefined}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
};