
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { CodeInput } from './components/CodeInput.tsx';
import { FeedbackDisplay } from './components/FeedbackDisplay.tsx';
import { LoadingSpinner } from './components/LoadingSpinner.tsx';
import { ApiKeyStatus } from './components/ApiKeyStatus.tsx';
import { ApiKeyManager } from './components/ApiKeyManager.tsx';
import { LoginPage } from './LoginPage.tsx';
import { 
  reviewCodeWithGemini, 
  refactorCodeWithGeminiStream, 
  getReactComponentPreview,
  generateCodeWithGemini,
  initializeGeminiClient, 
  clearGeminiClient,
  startChatSession,
  sendMessageToChatStream,
} from './services/geminiService.ts'; // Changed from @/services to ./services
import { Chat } from '@google/genai';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ActiveTab = 'review' | 'refactor' | 'preview' | 'generate' | 'chat' | 'documentation';
type ApiKeySource = 'ui' | 'env' | 'none';
type Theme = 'light' | 'dark';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

// Custom component for rendering <pre> blocks with a copy button in documentation
const PreWithCopyButton: React.FC<React.HTMLAttributes<HTMLPreElement> & { node?: any }> = ({ children, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const existingClassName = props.className || '';

  const onCopy = useCallback(() => {
    if (preRef.current) {
      const codeElement = preRef.current.querySelector('code');
      if (codeElement && codeElement.innerText) {
        navigator.clipboard.writeText(codeElement.innerText).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
          console.error('Failed to copy documentation code: ', err);
          // Optionally, set an error state or display a toast notification here
        });
      }
    }
  }, []);

  return (
    <div className="relative group my-4"> {/* Added my-4 for spacing, prose might also handle this */}
      <button
        onClick={onCopy}
        title={isCopied ? "Copied!" : "Copy code"}
        aria-label={isCopied ? "Code copied to clipboard" : "Copy code to clipboard"}
        className={`absolute top-2 right-2 p-1.5 rounded-md transition-all duration-150 ease-in-out 
                    opacity-0 group-hover:opacity-70 focus:opacity-100 hover:opacity-100
                    ${isCopied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500'}`}
      >
        {isCopied ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
          </svg>
        )}
        <span className="sr-only">{isCopied ? "Copied!" : "Copy code"}</span>
      </button>
      <pre {...props} ref={preRef} className={existingClassName}>
        {children}
      </pre>
    </div>
  );
};


const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeApiKey, setActiveApiKey] = useState<string | null>(null);
  const [apiKeySource, setApiKeySource] = useState<ApiKeySource>('none');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('review');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [activeChatSession, setActiveChatSession] = useState<Chat | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null); 

  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      return storedTheme;
    }
    return 'dark'; 
  });

  const [documentationContent, setDocumentationContent] = useState<string>('');
  const [isDocLoading, setIsDocLoading] = useState<boolean>(false);

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
    if (storedKey) {
      setActiveApiKey(storedKey);
      initializeGeminiClient(storedKey);
      setApiKeySource('ui');
    } else if (process.env.API_KEY && process.env.API_KEY.trim() !== '') {
      setActiveApiKey(process.env.API_KEY);
      initializeGeminiClient(process.env.API_KEY);
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
    }
  }, []);

  const handleRemoveApiKey = useCallback(() => {
    localStorage.removeItem('geminiApiKey');
    setActiveApiKey(null);
    clearGeminiClient();
    setApiKeySource('none');
    setError(null); 
    setFeedback(''); 
    setDocumentationContent(''); // Clear doc content if API key is removed
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('isWesAiUserLoggedIn', 'true');
    setIsLoggedIn(true);
    initializeActiveApiKey(); 
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('isWesAiUserLoggedIn');
    setIsLoggedIn(false);
    handleRemoveApiKey(); 
    setCode('');
    setFeedback('');
    setError(null);
    setChatMessages([]);
    setChatInput('');
    setActiveChatSession(null);
    setDocumentationContent('');
  }, [handleRemoveApiKey]);

  const handleCodeChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
  }, []);

  const isApiKeyConfigured = !!activeApiKey;

  const handleTabChange = useCallback(async (tab: ActiveTab) => {
    setActiveTab(tab);
    setFeedback(''); 
    setError(null); // Clear general errors on tab change

    if ((tab === 'chat' || activeTab === 'chat') || (tab === 'generate' || activeTab === 'generate')) {
        if (tab !== activeTab) setCode(''); 
    }

    if (tab === 'documentation') {
      if (!documentationContent && !isDocLoading) { // Fetch only if not already loaded or loading
        setIsDocLoading(true);
        try {
          const response = await fetch('/public/README.md');
          if (!response.ok) {
            throw new Error(`Failed to fetch documentation: ${response.statusText}`);
          }
          const markdown = await response.text();
          setDocumentationContent(markdown);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
          setError(`Error loading documentation: ${errorMessage}`);
          setDocumentationContent(''); // Clear content on error
          console.error(err);
        } finally {
          setIsDocLoading(false);
        }
      }
    } else if (tab === 'chat') {
      if (!activeChatSession && isApiKeyConfigured) {
        setIsLoading(true); 
        try {
          const systemInstruction = "You are WesAI Code Assistant, an AI pair programmer specializing in TypeScript and React. You can help answer follow-up questions about code reviews, refactoring, component explanations, code generation, or general coding queries related to these technologies. Please provide your responses in Markdown format.";
          const session = await startChatSession(systemInstruction);
          setActiveChatSession(session);
          setChatMessages([]); 
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
          setError(`Failed to start chat session: ${errorMessage}`);
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else if (!isApiKeyConfigured) {
         setError("API Key is not configured. Please set your API key to use chat.");
      }
    }
  }, [activeTab, isApiKeyConfigured, documentationContent, isDocLoading, activeChatSession]); // Added dependencies
  
  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatMessages]);


  const getActionVerb = (tab: ActiveTab): string => {
    if (tab === 'review') return 'review';
    if (tab === 'refactor') return 'refactor';
    if (tab === 'preview') return 'get a preview for';
    if (tab === 'generate') return 'generate code based on';
    if (tab === 'chat') return 'chat with WesAI about';
    if (tab === 'documentation') return 'view';
    return 'process';
  }

  const getButtonText = (tab: ActiveTab, loading: boolean): string => {
    if (loading) {
      if (tab === 'review') return 'Reviewing...';
      if (tab === 'refactor') return 'Refactoring...';
      if (tab === 'preview') return 'Generating Preview...';
      if (tab === 'generate') return 'Generating Code...';
      if (tab === 'chat') return 'Sending...';
    } else {
      if (tab === 'review') return 'Review Code';
      if (tab === 'refactor') return 'Refactor Code';
      if (tab === 'preview') return 'Get Component Preview';
      if (tab === 'generate') return 'Generate Code';
      if (tab === 'chat') return 'Send';
    }
    if (tab === 'documentation') return ''; // No main action button for documentation
    return 'Submit';
  }

  const getFeedbackTitle = (tab: ActiveTab): string => {
    if (tab === 'review') return 'Review Feedback:';
    if (tab === 'refactor') return 'Refactoring Result:';
    if (tab === 'preview') return 'Component Preview:';
    if (tab === 'generate') return 'Generated Code:';
    if (tab === 'chat') return 'Chat with WesAI:';
    if (tab === 'documentation') return 'Application Documentation (README):';
    return 'Result:';
  }

  const getLoadingMessage = (tab: ActiveTab): string => {
    if (tab === 'review') return 'Generating review, please wait...';
    if (tab === 'refactor') return 'Generating refactoring results, please wait...';
    if (tab === 'preview') return 'Generating preview description, please wait...';
    if (tab === 'generate') return 'Generating your code, please wait...';
    if (tab === 'chat') return 'WesAI is thinking...';
    if (tab === 'documentation') return 'Loading documentation...';
    return 'Processing, please wait...';
  }
  
  const getInputPlaceholder = (tab: ActiveTab): string => {
    if (tab === 'chat') return "Type your message here...";
    if (tab === 'generate') return "Describe the code you want to generate (e.g., 'a React component that fetches and displays a list of users', or 'a TypeScript function to sort an array by a property')...";
    if (tab === 'documentation') return ""; // No input for documentation
    return "Paste your code here...";
  }

  const getInputLabel = (tab: ActiveTab): string => {
    if (tab === 'generate') return `Describe the code you want to ${getActionVerb(tab)}:`;
    if (tab === 'documentation') return ""; // No input label for documentation
    return `Enter React/TypeScript component code to ${getActionVerb(tab)}:`;
  }

  const handleSubmit = useCallback(async () => {
    if (!activeApiKey) {
      setError("Gemini API key is not configured. Please set it in the API Key Management section.");
      return;
    }
    
    // This check is now specific to tabs that require code input
    if (activeTab !== 'generate' && activeTab !== 'chat' && activeTab !== 'documentation' && !code.trim()) { 
      setError(`Please enter some code to ${getActionVerb(activeTab)}.`);
      return;
    }
    if (activeTab === 'generate' && !code.trim()) {
      setError(`Please enter a description to ${getActionVerb(activeTab)}.`);
      return;
    }


    setIsLoading(true);
    setFeedback('');
    setError(null);

    try {
      if (activeTab === 'review') {
        const result = await reviewCodeWithGemini(code);
        setFeedback(result);
      } else if (activeTab === 'refactor') {
        let fullRefactorText = `## ${getFeedbackTitle(activeTab)}\n\n`;
        setFeedback(fullRefactorText); 
        for await (const part of refactorCodeWithGeminiStream(code)) {
          if (part.type === 'chunk' && part.data) {
            fullRefactorText += part.data;
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
        const result = await generateCodeWithGemini(code); // 'code' here is actually the description
        setFeedback(result);
      }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(`Error during ${activeTab}: ${errorMessage}`);
        console.error(`Error in ${activeTab}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, code, activeApiKey, getActionVerb, getFeedbackTitle]);


  const handleChatSubmit = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !activeChatSession || !isApiKeyConfigured) {
      if (!isApiKeyConfigured) setError("API Key is not configured for chat.");
      else if (!activeChatSession) setError("Chat session not active. Please try changing tabs or ensure API key is set.");
      return;
    }

    const userMessageId = `user-${Date.now()}`;
    const modelMessageId = `model-${Date.now() + 1}`;

    setChatMessages(prev => [...prev, { id: userMessageId, role: 'user', content: chatInput }]);
    const currentInput = chatInput;
    setChatInput('');
    setIsLoading(true);
    setError(null);

    setChatMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '' }]);

    try {
      const stream = await sendMessageToChatStream(activeChatSession, currentInput);
      let currentModelContent = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text; 
        const finishReason = chunk.candidates?.[0]?.finishReason;
        const safetyRatings = chunk.candidates?.[0]?.safetyRatings;

        if (chunkText) {
          currentModelContent += chunkText;
          setChatMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: currentModelContent } : msg
          ));
        }
        if (finishReason) {
          console.log("Chat stream finished:", finishReason, safetyRatings);
          if (finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
             setChatMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, content: msg.content + `\n\n*(Stream finished: ${finishReason})*` } : msg
            ));
            if (finishReason === 'SAFETY') {
                setError("The response was blocked due to safety settings.");
            }
          }
          break; 
        }
      }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(`Chat error: ${errorMessage}`);
        console.error("Chat submit error:", err);
        setChatMessages(prev => prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, content: `*(Error: ${errorMessage})*` } : msg
        ));
    } finally {
      setIsLoading(false);
    }
  }, [activeChatSession, chatInput, isApiKeyConfigured]);


  const handleCopyChatMessage = useCallback((content: string, messageId: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy chat message: ', err);
      setError("Failed to copy message to clipboard.");
    });
  }, []);

  const markdownComponents: Components = {
    pre: PreWithCopyButton,
  };


  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} currentTheme={theme} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-0 sm:p-6 dark:bg-gray-900">
      <div className="w-full max-w-5xl">
        <Header title="WesAI Code Assistant" theme={theme} toggleTheme={toggleTheme} />
        
        <div className="my-6">
            <ApiKeyManager 
                onSaveKey={handleSaveApiKey} 
                onRemoveKey={handleRemoveApiKey}
                isKeySet={isApiKeyConfigured}
                currentKeySource={apiKeySource}
                onLogout={handleLogout}
            />
            <div className="mt-2">
                <ApiKeyStatus apiKeyIsSet={isApiKeyConfigured} apiKeySource={apiKeySource} />
            </div>
        </div>

        <div className="mb-6 border-b border-gray-300 dark:border-gray-700 flex flex-wrap justify-center">
          {['review', 'refactor', 'preview', 'generate', 'chat', 'documentation'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab as ActiveTab)}
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

        <main className="space-y-6">
          {activeTab !== 'chat' && activeTab !== 'documentation' && (
            <>
              <div>
                <label htmlFor="codeInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {getInputLabel(activeTab)}
                </label>
                <CodeInput 
                  value={code} 
                  onChange={handleCodeChange} 
                  disabled={isLoading || !isApiKeyConfigured}
                  placeholder={getInputPlaceholder(activeTab)}
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={isLoading || !isApiKeyConfigured || !code.trim()}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading && <LoadingSpinner />}
                {getButtonText(activeTab, isLoading)}
              </button>
            </>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-[60vh] bg-gray-50 dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
              <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xl lg:max-w-2xl p-3 rounded-xl shadow ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100 relative group' 
                      }`}
                    >
                      <div className={`prose prose-sm sm:prose-base max-w-none 
                                      ${msg.role === 'user' ? 'prose-invert-user-bubble' : 'dark:prose-invert'}
                                      prose-p:my-1 prose-li:my-0.5
                                      dark:prose-code:bg-slate-800 dark:prose-pre:bg-slate-800
                                      ${msg.role === 'model' ? 'pr-6 pt-1' : ''}
                                      `}>
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.role === 'model' && msg.content.trim() && (
                        <button
                            onClick={() => handleCopyChatMessage(msg.content, msg.id)}
                            title={copiedMessageId === msg.id ? "Copied!" : "Copy Markdown"}
                            aria-label={copiedMessageId === msg.id ? "Markdown copied to clipboard" : "Copy Markdown to clipboard"}
                            className={`absolute top-1.5 right-1.5 p-1 rounded-md transition-all duration-150 ease-in-out 
                                        opacity-0 group-hover:opacity-60 focus:opacity-100 hover:opacity-100
                                        ${copiedMessageId === msg.id 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500'}`}
                        >
                            {copiedMessageId === msg.id ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                </svg>
                            )}
                            <span className="sr-only">{copiedMessageId === msg.id ? "Copied!" : "Copy Markdown"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>
              <form onSubmit={handleChatSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={isLoading ? "WesAI is thinking..." : getInputPlaceholder('chat')}
                    disabled={isLoading || !isApiKeyConfigured || !activeChatSession}
                    className="flex-grow p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm"
                    aria-label="Chat input"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !isApiKeyConfigured || !activeChatSession || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md transition duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
                  >
                    {isLoading && activeTab === 'chat' && <LoadingSpinner />} {/* Ensure spinner only for chat loading */}
                    {getButtonText('chat', isLoading)}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'documentation' && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">{getFeedbackTitle(activeTab)}</h2>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 md:p-6 rounded-lg shadow-inner overflow-y-auto max-h-[70vh]">
                {isDocLoading && (
                  <div className="flex flex-col items-center justify-center p-6">
                    <LoadingSpinner />
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{getLoadingMessage(activeTab)}</p>
                  </div>
                )}
                {!isDocLoading && error && documentationContent === '' && ( // Show error if doc loading failed and no content
                  <div className="text-red-700 dark:text-red-300 p-4 bg-red-100 dark:bg-red-700/20 rounded-md">
                    <strong className="font-semibold">Error:</strong> Could not load documentation. {error.includes("Failed to fetch documentation") ? "Please ensure README.md is accessible in the public root directory." : error}
                  </div>
                )}
                {!isDocLoading && !error && documentationContent && (
                  <div 
                    className="prose prose-sm sm:prose-base max-w-none dark:prose-invert 
                               prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-slate-800 dark:prose-headings:text-slate-200 
                               prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-4 
                               prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:pb-2 prose-h2:border-slate-200 dark:prose-h2:border-slate-700
                               prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-2 
                               prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
                               prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:my-1
                               prose-strong:text-slate-900 dark:prose-strong:text-slate-100 
                               prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline prose-a:font-medium
                               prose-blockquote:border-l-4 prose-blockquote:border-blue-500 dark:prose-blockquote:border-blue-400 
                               prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-blockquote:my-4
                               prose-code:text-pink-600 dark:prose-code:text-pink-400 
                               prose-code:bg-slate-200/60 dark:prose-code:bg-slate-700/60
                               prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal
                               prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800
                               prose-pre:p-4 prose-pre:rounded-lg prose-pre:shadow-sm
                               prose-pre:text-slate-800 dark:prose-pre:text-slate-200
                               prose-hr:my-8 prose-hr:border-slate-200 dark:prose-hr:border-slate-700"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {documentationContent}
                    </ReactMarkdown>
                  </div>
                )}
                {!isDocLoading && !documentationContent && !error && (
                  <p className="text-gray-500 dark:text-gray-400">No documentation content loaded or available.</p>
                )}
              </div>
            </div>
          )}


          {error && activeTab !== 'documentation' && ( // General error display, not for doc loading errors shown above
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-700/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded-md shadow" role="alert">
              <strong className="font-semibold">Error:</strong> {error}
            </div>
          )}

          {feedback && !isLoading && activeTab !== 'chat' && activeTab !== 'documentation' && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{getFeedbackTitle(activeTab)}</h2>
              <FeedbackDisplay feedback={feedback} />
            </div>
          )}
          
          {isLoading && activeTab !== 'chat' && activeTab !== 'documentation' && (
             <div className="mt-6 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800/30 rounded-lg shadow-md">
                <LoadingSpinner />
                <p className="mt-2 text-gray-600 dark:text-gray-300">{getLoadingMessage(activeTab)}</p>
            </div>
          )}
        </main>
        <footer className="text-center mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              WesAI Code Assistant - Your AI Pair Programmer. Powered by Google Gemini.
            </p>
        </footer>
      </div>
      <style>{`
        .prose-invert-user-bubble code { color: #e5e7eb !important; } /* Lighter code color for user bubble in dark mode */
        .prose-invert-user-bubble strong { color: #f9fafb !important; }
        .prose-invert-user-bubble { color: #f9fafb !important; } /* Ensure all text in user bubble is light in dark mode */
        .prose-invert-user-bubble a { color: #93c5fd !important; } /* Light blue for links */
      `}</style>
    </div>
  );
};

export default App;