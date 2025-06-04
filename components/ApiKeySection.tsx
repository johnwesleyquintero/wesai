import React from 'react';
import { ApiKeyManager } from './ApiKeyManager.tsx';
import { ApiKeySource, Theme } from '../types.ts';

interface ApiKeySectionProps {
  onSaveKey: (key: string) => void;
  onRemoveKey: () => void;
  isKeySet: boolean;
  currentKeySource: ApiKeySource;
  onLogout: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

export const ApiKeySection: React.FC<ApiKeySectionProps> = ({
  onSaveKey,
  onRemoveKey,
  isKeySet,
  currentKeySource,
  onLogout,
  theme,
  toggleTheme,
}) => {
  return (
    <div className="my-6">
      <ApiKeyManager
        onSaveKey={onSaveKey}
        onRemoveKey={onRemoveKey}
        isKeySet={isKeySet}
        currentKeySource={currentKeySource}
        onLogout={onLogout}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <div className="mt-2"></div>
    </div>
  );
};
