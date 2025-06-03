
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { LoginPage } from './LoginPage.tsx';
import { 
  reviewCodeWithGemini, 
  refactorCodeWithGeminiStream, 
  getReactComponentPreview,
  generateCodeWithGemini,
  generateContentWithGemini,
  generateImageWithImagen,
  initializeGeminiClient, 
  clearGeminiClient,
  startChatSession,
  sendMessageToChatStream,
} from './services/geminiService.ts';
import { Chat } from '@google/genai';

// Import new components
import { ApiKeySection } from './components/ApiKeySection.tsx';
import { TabNavigation } from './components/TabNavigation.tsx';
import { CodeInteractionPanel } from './components/CodeInteractionPanel.tsx';
import { ChatInterfacePanel } from './components/ChatInterfacePanel.tsx';
import { DocumentationViewerPanel } from './components/DocumentationViewerPanel.tsx';
import { ImageGenerationPanel } from './components/ImageGenerationPanel.tsx'; 

// Import shared types
import { ActiveTab, ApiKeySource, Theme, ChatMessage } from './types.ts';


const App: React.FC = () => {
  const [code, setCode] = useState<string>(''); // Used for code input or content description
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeApiKey, setActiveApiKey] = useState<string | null>(null);
  const [apiKeySource, setApiKeySource] = useState<ApiKeySource>('none');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('review');
  
  // Chat specific state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [activeChatSession, setActiveChatSession] = useState<Chat | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null); 
  const [chatError, setChatError] = useState<string | null>(null);

  // Image generation specific state
  const [imagePrompt, setImagePrompt] = useState<string>('');
  const [generatedImageData, setGeneratedImageData] = useState<string | null>(null);


  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) return storedTheme;
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const initializeActiveApiKey = useCallback(() => {
    const storedKey = localStorage.getItem('geminiApiKey');
    const envApiKey = typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_GEMINI_API_KEY : undefined;

    if (storedKey) {
      setActiveApiKey(storedKey);
      initializeGeminiClient(storedKey);
      setApiKeySource('ui');
    } else if (envApiKey && envApiKey.trim() !== '') {
      setActiveApiKey(envApiKey);
      initializeGeminiClient(envApiKey);
      setApiKeySource('env');
    } else {
      clearGeminiClient();
      setActiveApiKey(null);
      setApiKeySource('none');
    }
  }, []); 

  useEffect(() => {
    const loggedInStatus = localStorage.getItem('isWesAiUserLoggedIn');
    if (loggedInStatus === 'true') {
      setIsLoggedIn(true);
      initializeActiveApiKey();
    } else {
      setIsLoggedIn(false);
      clearGeminiClient();
      setActiveApiKey(null);
      setApiKeySource('none');
    }
  }, [initializeActiveApiKey]);

  const handleSaveApiKey = useCallback((key: string) => {
    if (key.trim()) {
      localStorage.setItem('geminiApiKey', key);
      setActiveApiKey(key);
      initializeGeminiClient(key);
      setApiKeySource('ui');
      setError(null); 
      setChatError(null);
    }
  }, []);

  const handleRemoveApiKey = useCallback(() => {
    localStorage.removeItem('geminiApiKey');
    // Clear data that was potentially generated with the removed key
    setFeedback('');
    setGeneratedImageData(null);
    setError(null);
    setChatError(null);
    setChatMessages([]);
    setActiveChatSession(null);
    // Now re-initialize. If an env key is found, it will be used.
    // If not, API key source will be 'none' and features requiring a key will be disabled.
    initializeActiveApiKey(); 
  }, [initializeActiveApiKey]);

  const handleLoginSuccess = () => {
    localStorage.setItem('isWesAiUserLoggedIn', 'true');
    setIsLoggedIn(true);
    initializeActiveApiKey(); 
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isWesAiUserLoggedIn');
    setIsLoggedIn(false);
    localStorage.removeItem('geminiApiKey'); // Also clear API key on logout
    setFeedback('');
    setGeneratedImageData(null);
    setError(null);
    setChatError(null);
    setChatMessages([]);
    setChatInput('');
    setActiveChatSession(null);
    setCode('');
    setImagePrompt('');
    // Re-initialize API key status (will likely be 'none' unless env var is set)
    initializeActiveApiKey(); 
  }, [initializeActiveApiKey]);


  const handleCodeChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
  }, []);

  const handleClearCodeInput = useCallback(() => {
    setCode('');
  }, []);

  const handleImagePromptChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setImagePrompt(event.target.value);
  }, []);

  const handleClearImagePrompt = useCallback(() => {
    setImagePrompt('');
  }, []);
  
  const handleChatInputChange = useCallback((value: string) => {
    setChatInput(value);
  }, []);

  const handleClearChatInput = useCallback(() => {
    setChatInput('');
  }, []);

  const isApiKeyConfigured = !!activeApiKey;

  const handleTabChange = useCallback(async (tab: ActiveTab) => {
    setActiveTab(tab);
    setFeedback(''); 
    setError(null); 
    setChatError(null);
    setGeneratedImageData(null); 

    if (tab !== 'image') {
        setImagePrompt(''); 
    }
    if (tab !== 'review' && tab !== 'refactor' && tab !== 'preview' && tab !== 'generate' && tab !== 'content') {
        setCode(''); 
    }
    
    if (tab === 'chat') {
      if (!activeChatSession && isApiKeyConfigured) {
        setIsLoading(true); 
        setChatError(null);
        try {
          const systemInstruction = "You are WesAI Code Assistant, an AI pair programmer specializing in TypeScript and React. You can help answer follow-up questions about code reviews, refactoring, component explanations, code generation, or general coding queries related to these technologies. Please provide your responses in Markdown format. When providing React component code, ensure it is a self-contained, runnable snippet, preferably as a default export or a component named 'PreviewComponent' to facilitate in-app previewing. Wrap the component code in a ```tsx ... ``` or ```jsx ... ``` block.";
          const session = await startChatSession(systemInstruction);
          setActiveChatSession(session);
          // setChatMessages([]); // Keep messages unless explicitly cleared or new session implies new context
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
          setChatError(`Failed to start chat session: ${errorMessage}`);
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else if (!isApiKeyConfigured) {
         setChatError("API Key is not configured. Please set your API key to use chat.");
      }
    }
  }, [isApiKeyConfigured, activeChatSession]); // Removed activeTab from dependencies as it causes loop with setActivetab
  

  const handleSubmitCodeInteraction = useCallback(async () => {
    setIsLoading(true);
    setFeedback(''); 
    setError(null);

    try {
      if (activeTab === 'review') {
        const result = await reviewCodeWithGemini(code);
        setFeedback(result);
      } else if (activeTab === 'refactor') {
        let fullRefactorText = `## Refactoring Summary:\n\n`; 
        setFeedback(fullRefactorText); 
        for await (const part of refactorCodeWithGeminiStream(code)) {
          if (part.type === 'chunk' && part.data) {
            setFeedback(prev => prev + (part.data || ''));
          } else if (part.type === 'error' && part.message) {
            setError(`Refactoring error: ${part.message}`); 
            break; 
          } else if (part.type === 'finish_reason') {
            console.log('Refactoring stream finished:', part.reason, part.safetyRatings);
            if (part.reason === 'SAFETY' || part.reason === 'OTHER') {
               setError(`Refactoring was stopped. Reason: ${part.reason}. Please check the content or try again.`);
            }
            break;
          }
        }
      } else if (activeTab === 'preview') {
        const result = await getReactComponentPreview(code);
        setFeedback(result);
      } else if (activeTab === 'generate') {
        const result = await generateCodeWithGemini(code); 
        setFeedback(result);
      } else if (activeTab === 'content') { 
        const result = await generateContentWithGemini(code); 
        setFeedback(result);
      }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(`Error during ${activeTab}: ${errorMessage}`);
        console.error(`Error in ${activeTab}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, code]); 

  const handleImageGenerationSubmit = useCallback(async () => {
    if (!imagePrompt.trim()) {
      setError("Please enter a description for the image.");
      return;
    }
    setIsLoading(true);
    setGeneratedImageData(null);
    setError(null);

    try {
      const imageData = await generateImageWithImagen(imagePrompt);
      setGeneratedImageData(imageData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during image generation.";
      setError(`Image Generation Error: ${errorMessage}`);
      console.error("Image generation error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [imagePrompt]);


  const extractComponentCode = (markdownContent: string): string | null => {
    const codeBlockRegex = /```(tsx|jsx)\s*\n([\s\S]+?)\n```/;
    const match = markdownContent.match(codeBlockRegex);
    if (match && match[2]) {
      const extractedCode = match[2];
      if (extractedCode.includes('React.createElement') || 
          extractedCode.match(/return\s*\(/) || 
          extractedCode.includes('props') || 
          extractedCode.includes('useState') || 
          extractedCode.includes('useEffect') ||
          extractedCode.includes('=> (') || 
          extractedCode.includes('function ') && extractedCode.includes('return (')) {
        return extractedCode;
      }
    }
    return null;
  };

  const handleChatSubmit = useCallback(async () => {
    const userMessageId = `user-${Date.now()}`;
    const modelMessageId = `model-${Date.now() + 1}`;

    setChatMessages(prev => [...prev, { id: userMessageId, role: 'user', content: chatInput }]);
    const currentInput = chatInput;
    setChatInput('');
    setIsLoading(true);
    setChatError(null); 

    setChatMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '', componentCode: null, showPreview: false }]);

    try {
      if (!activeChatSession) throw new Error("Chat session not active.");
      const stream = await sendMessageToChatStream(activeChatSession, currentInput);
      let currentModelContent = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text; 
        const finishReason = chunk.candidates?.[0]?.finishReason;
        const safetyRatings = chunk.candidates?.[0]?.safetyRatings;

        if (chunkText) {
          currentModelContent += chunkText;
          const componentCode = extractComponentCode(currentModelContent);
          setChatMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: currentModelContent, componentCode: componentCode } : msg
          ));
        }
        if (finishReason) {
          console.log("Chat stream finished:", finishReason, safetyRatings);
          const finalComponentCode = extractComponentCode(currentModelContent);
          if (finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
             setChatMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, content: msg.content + `\n\n*(Stream finished: ${finishReason})*`, componentCode: finalComponentCode } : msg
            ));
            if (finishReason === 'SAFETY') {
                setChatError("The response was blocked due to safety settings.");
            }
          } else {
             setChatMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, componentCode: finalComponentCode } : msg
            ));
          }
          break; 
        }
      }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setChatError(`Chat error: ${errorMessage}`); 
        console.error("Chat submit error:", err);
        setChatMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: `*(Error: ${errorMessage})*`, componentCode: null } : msg
        ));
    } finally {
      setIsLoading(false);
    }
  }, [activeChatSession, chatInput]);


  const handleCopyChatMessage = useCallback((content: string, messageId: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy chat message: ', err);
      setChatError("Failed to copy message to clipboard."); 
    });
  }, []);

  const handleTogglePreview = useCallback((messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, showPreview: !msg.showPreview } : msg
    ));
  }, []);

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} currentTheme={theme} />;
  }

  const codeInteractionActive = activeTab === 'review' || activeTab === 'refactor' || activeTab === 'preview' || activeTab === 'generate' || activeTab === 'content';

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-0 sm:p-6">
      <div className="w-full max-w-5xl">
        <Header title="WesAI Code Assistant" theme={theme} toggleTheme={toggleTheme} />
        
        <ApiKeySection 
            onSaveKey={handleSaveApiKey}
            onRemoveKey={handleRemoveApiKey}
            isKeySet={isApiKeyConfigured}
            currentKeySource={apiKeySource}
            onLogout={handleLogout}
        />

        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

        <main className="space-y-6">
          {codeInteractionActive && (
            <CodeInteractionPanel
              activeTab={activeTab as 'review' | 'refactor' | 'preview' | 'generate' | 'content'}
              code={code}
              onCodeChange={handleCodeChange}
              onClearInput={handleClearCodeInput}
              onSubmit={handleSubmitCodeInteraction}
              isLoading={isLoading}
              isApiKeyConfigured={isApiKeyConfigured}
              feedback={feedback}
              error={error} 
              setError={setError} 
            />
          )}

          {activeTab === 'image' && (
            <ImageGenerationPanel
              prompt={imagePrompt}
              onPromptChange={handleImagePromptChange}
              onClearPrompt={handleClearImagePrompt}
              onSubmit={handleImageGenerationSubmit}
              isLoading={isLoading}
              isApiKeyConfigured={isApiKeyConfigured}
              imageData={generatedImageData}
              error={error}
              setError={setError}
            />
          )}

          {activeTab === 'chat' && (
            <ChatInterfacePanel
              chatMessages={chatMessages}
              chatInput={chatInput}
              onChatInputChange={handleChatInputChange}
              onClearChatInput={handleClearChatInput}
              onChatSubmit={handleChatSubmit}
              isLoading={isLoading}
              isApiKeyConfigured={isApiKeyConfigured}
              isChatSessionActive={!!activeChatSession}
              onCopyChatMessage={handleCopyChatMessage}
              onTogglePreview={handleTogglePreview}
              copiedMessageId={copiedMessageId}
              error={chatError} 
            />
          )}

          {activeTab === 'documentation' && (
            <DocumentationViewerPanel />
          )}
        </main>
        <footer className="text-center mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              WesAI Code Assistant - Your AI Pair Programmer & Creator. Powered by Google Gemini & Imagen.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
