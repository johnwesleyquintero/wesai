import { Chat } from '@google/genai';

export type ActiveTab = 'review' | 'refactor' | 'preview' | 'generate' | 'chat' | 'documentation' | 'content' | 'image';
export type ApiKeySource = 'ui' | 'env' | 'none';
export type Theme = 'light' | 'dark';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  componentCode?: string | null; // Extracted React component code string, if any
  showPreview?: boolean; // Toggles between code view and preview view for this message
}