import React, { useState, useRef, useEffect } from 'react';
import { Send, GraduationCap, Info, Mic, MicOff, RotateCcw, Moon, Sun, AlertCircle, Maximize, Minimize, BookOpen, MessageSquare, ListTodo, BarChart2 } from 'lucide-react';
import { ChatMessage, Attachment, SavedItem, ProblemItem, ProgressReport } from './types';
import { streamGeminiResponse, extractMathProblem } from './services/geminiService';
import { MessageBubble } from './components/MessageBubble';
import { ThinkingIndicator } from './components/ThinkingIndicator';
import { ImageUpload } from './components/ImageUpload';
import { LoginOverlay } from './components/LoginOverlay';
import { StudyGuide } from './components/StudyGuide';
import { ProblemList } from './components/ProblemList';
import { ProgressDashboard } from './components/ProgressDashboard';

const App: React.FC = () => {
  // Theme management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
        return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
      }
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch(e) {}
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Fullscreen management
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  // View Mode
  const [viewMode, setViewMode] = useState<'chat' | 'guide' | 'problems' | 'progress'>('chat');

  // Load auth state from local storage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('math_tutor_auth') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Load chat history from local storage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('math_tutor_messages');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load chat history", e);
      return [];
    }
  });

  // Load saved study guide items
  const [savedItems, setSavedItems] = useState<SavedItem[]>(() => {
    try {
        const saved = localStorage.getItem('math_tutor_guide');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  // Load saved problems
  const [savedProblems, setSavedProblems] = useState<ProblemItem[]>(() => {
    try {
        const saved = localStorage.getItem('math_tutor_problems');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  // Load progress report
  const [progressReport, setProgressReport] = useState<ProgressReport | null>(() => {
    try {
        const saved = localStorage.getItem('math_tutor_progress');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
  });

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Persist authentication state
  useEffect(() => {
    localStorage.setItem('math_tutor_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  // Persist chat history
  useEffect(() => {
    try {
      localStorage.setItem('math_tutor_messages', JSON.stringify(messages));
    } catch (e) {
      console.warn("LocalStorage quota exceeded or error saving messages", e);
    }
  }, [messages]);

  // Persist study guide
  useEffect(() => {
    try {
        localStorage.setItem('math_tutor_guide', JSON.stringify(savedItems));
    } catch (e) {
        console.warn("LocalStorage quota exceeded saving guide", e);
    }
  }, [savedItems]);

  // Persist problems
  useEffect(() => {
    try {
        localStorage.setItem('math_tutor_problems', JSON.stringify(savedProblems));
    } catch (e) {
        console.warn("LocalStorage quota exceeded saving problems", e);
    }
  }, [savedProblems]);

  // Persist progress
  useEffect(() => {
    try {
        if (progressReport) {
            localStorage.setItem('math_tutor_progress', JSON.stringify(progressReport));
        }
    } catch (e) {
        console.warn("LocalStorage quota exceeded saving progress", e);
    }
  }, [progressReport]);

  // Initial welcome message - only if no history exists
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: "Hello! I'm your University Entrance Exam Tutor. \n\nI'm here to ensure you get full marks on your complex calculus or algebra problems.\n\nYou can:\n• Upload a photo of a problem\n• Type a problem equation\n• Ask me to explain a concept (e.g., \"Explain integrals\")\n\nWe'll work through it step-by-step so you truly understand. Where should we start?"
        }
      ]);
    }
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (viewMode === 'chat') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, viewMode]);

  // Adjust textarea height
  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  const handleLogin = (key: string) => {
    if (key === 'PASS-2025') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleClearChat = () => {
    if (window.confirm("Start a new session? This will clear your current chat history.")) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: "Hello! I'm your University Entrance Exam Tutor. \n\nI'm here to ensure you get full marks on your complex calculus or algebra problems.\n\nYou can:\n• Upload a photo of a problem\n• Type a problem equation\n• Ask me to explain a concept (e.g., \"Explain integrals\")\n\nWe'll work through it step-by-step so you truly understand. Where should we start?"
        }
      ]);
      // LocalStorage will be updated by the useEffect
    }
  };

  // Study Guide Handlers
  const handleSaveToGuide = (messageId: string, text: string) => {
    setSavedItems(prev => {
        // Avoid duplicates based on message ID
        if (prev.some(item => item.originalMessageId === messageId)) {
            return prev.filter(item => item.originalMessageId !== messageId); // Toggle off
        }
        return [...prev, {
            id: Date.now().toString(),
            originalMessageId: messageId,
            content: text,
            timestamp: Date.now(),
            type: 'concept'
        }];
    });
  };

  const handleRemoveFromGuide = (id: string) => {
    setSavedItems(prev => prev.filter(item => item.id !== id));
  };

  // Problems List Handlers
  const handleAddProblem = async (attachment: Attachment) => {
    try {
        // Call Gemini to extract the text
        const extractedText = await extractMathProblem(attachment.base64, attachment.mimeType);
        
        const newProblem: ProblemItem = {
            id: Date.now().toString(),
            image: attachment.base64,
            mimeType: attachment.mimeType,
            text: extractedText,
            timestamp: Date.now()
        };
        
        setSavedProblems(prev => [newProblem, ...prev]);
    } catch (e) {
        console.error("Failed to add problem", e);
        throw e;
    }
  };

  const handleRemoveProblem = (id: string) => {
    setSavedProblems(prev => prev.filter(p => p.id !== id));
  };

  const handleSelectProblem = (item: ProblemItem) => {
    // 1. Switch to chat
    setViewMode('chat');
    
    // 2. Set the attachment state from the saved problem
    // Reconstruct the file object is tricky, but we have base64. 
    // The Attachment interface needs a file object mostly for the file input logic, 
    // but the app logic uses previewUrl and base64.
    // We can mock the file object for the sake of the state since we don't need to re-upload it.
    const mockFile = new File([""], "saved-problem.png", { type: item.mimeType });
    
    setAttachment({
        file: mockFile,
        base64: item.image,
        mimeType: item.mimeType,
        previewUrl: `data:${item.mimeType};base64,${item.image}`
    });
    
    // 3. Pre-fill input
    setInputText(`Help me understand and solve this problem step-by-step: ${item.text}`);
    
    // Focus input
    setTimeout(() => {
        inputRef.current?.focus();
    }, 100);
  };

  // Progress Handler
  const handleUpdateProgress = (report: ProgressReport) => {
    setProgressReport(report);
  };

  // Voice Input Handler
  const toggleListening = () => {
    setVoiceError(null);

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      setTimeout(() => setVoiceError(null), 6000);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      
      let message = "An error occurred with voice input.";
      switch(event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          message = "Microphone access blocked. Please allow permissions in your URL bar.";
          break;
        case 'no-speech':
          message = "No speech detected. Please speak closer to the microphone.";
          break;
        case 'network':
          message = "Network error. Please check your connection.";
          break;
        case 'audio-capture':
          message = "No microphone found. Please check your settings.";
          break;
        case 'aborted':
           return; // Don't show error for aborted
        default:
          message = `Voice input error: ${event.error}`;
      }
      
      setVoiceError(message);
      setTimeout(() => setVoiceError(null), 5000);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => {
        const newText = prev ? `${prev} ${transcript}` : transcript;
        return newText;
      });
    };

    recognitionRef.current = recognition;
    try {
        recognition.start();
    } catch (e) {
        console.error("Failed to start recognition", e);
        setVoiceError("Failed to start microphone.");
        setTimeout(() => setVoiceError(null), 4000);
    }
  };

  // Logic for freemium limit
  const modelMessagesCount = messages.filter(m => m.role === 'model').length;
  const showLimitOverlay = !isAuthenticated && modelMessagesCount >= 2 && !isLoading;

  const handleSendMessage = async (textOverride?: string | React.MouseEvent) => {
    const isOverride = typeof textOverride === 'string';
    const userMessageText = isOverride ? textOverride : inputText.trim();
    
    if ((!userMessageText && !attachment) || isLoading) return;

    const currentAttachment = attachment;

    // Clear inputs immediately
    setInputText('');
    setAttachment(null);
    setVoiceError(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Add User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userMessageText,
      image: currentAttachment ? currentAttachment.previewUrl : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Create a placeholder for the model response
      const modelMsgId = (Date.now() + 1).toString();
      
      let fullResponseText = '';
      
      const stream = streamGeminiResponse(
        messages, // Pass previous history
        userMessageText,
        currentAttachment?.base64,
        currentAttachment?.mimeType
      );

      for await (const chunk of stream) {
        fullResponseText += chunk;
        
        setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg.id === modelMsgId) {
                // Update existing model message
                return [
                    ...prev.slice(0, -1),
                    { ...lastMsg, text: fullResponseText }
                ];
            } else {
                // Create new model message
                return [
                    ...prev,
                    { id: modelMsgId, role: 'model', text: fullResponseText }
                ];
            }
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          text: "I'm sorry, I encountered an error while analyzing that. Please try again."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGiveUp = () => {
    handleSendMessage("Just show me the full step-by-step solution immediately.");
  };

  const handleExplainConcept = () => {
    handleSendMessage("Provide a standalone explanation of the key mathematical concept or theorem used in this step. Include a visual and an analogy. Do not solve the problem further, just explain the concept.");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-200">
      {/* Login Overlay / Limit Reached */}
      {showLimitOverlay && (
        <LoginOverlay 
            onLogin={handleLogin} 
            purchaseUrl="https://example.com/pricing"
        />
      )}

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-700 dark:text-emerald-400">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">Uni Entrance Exam Bot</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Premium Edition • Gemini 3 Pro Reasoning</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setViewMode(prev => prev === 'progress' ? 'chat' : 'progress')}
                className={`transition-colors p-2 rounded-full ${
                    viewMode === 'progress' 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={viewMode === 'progress' ? "Back to Tutor" : "Progress Dashboard"}
            >
                {viewMode === 'progress' ? <MessageSquare size={20} /> : <BarChart2 size={20} />}
            </button>
            <button
                onClick={() => setViewMode(prev => prev === 'problems' ? 'chat' : 'problems')}
                className={`transition-colors p-2 rounded-full ${
                    viewMode === 'problems' 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={viewMode === 'problems' ? "Back to Tutor" : "Problems to Solve"}
            >
                {viewMode === 'problems' ? <MessageSquare size={20} /> : <ListTodo size={20} />}
            </button>
            <button
                onClick={() => setViewMode(prev => prev === 'guide' ? 'chat' : 'guide')}
                className={`transition-colors p-2 rounded-full ${
                    viewMode === 'guide' 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={viewMode === 'guide' ? "Back to Tutor" : "Open Study Guide"}
            >
                {viewMode === 'guide' ? <MessageSquare size={20} /> : <BookOpen size={20} />}
            </button>
            <button
                onClick={toggleFullScreen}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
                {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
            <button 
                onClick={toggleTheme}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button 
                onClick={handleClearChat}
                className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                title="Start New Chat"
            >
                <RotateCcw size={20} />
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-y-auto scrollbar-hide transition-all duration-500 ${showLimitOverlay ? 'blur-sm select-none overflow-hidden' : ''}`}>
        
        {viewMode === 'guide' ? (
           <StudyGuide 
              items={savedItems} 
              onRemove={handleRemoveFromGuide} 
              onBack={() => setViewMode('chat')} 
           />
        ) : viewMode === 'problems' ? (
           <ProblemList 
               items={savedProblems}
               onRemove={handleRemoveProblem}
               onSelect={handleSelectProblem}
               onAdd={handleAddProblem}
           />
        ) : viewMode === 'progress' ? (
           <ProgressDashboard 
               history={messages}
               savedReport={progressReport}
               onUpdateReport={handleUpdateProgress}
               onBack={() => setViewMode('chat')}
           />
        ) : (
            <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full p-4 md:p-6">
            {messages.map((msg, index) => {
                const isLastMessage = index === messages.length - 1;
                const isModel = msg.role === 'model';
                const showGiveUp = !isLoading && isLastMessage && isModel && msg.id !== 'welcome';
                const isSaved = savedItems.some(item => item.originalMessageId === msg.id);
                
                return (
                <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    showGiveUpButton={showGiveUp}
                    onGiveUp={handleGiveUp}
                    onExplainConcept={handleExplainConcept}
                    onSaveToGuide={(text) => handleSaveToGuide(msg.id, text)}
                    isSaved={isSaved}
                />
                );
            })}
            
            {isLoading && !messages.some(m => m.role === 'model' && m.id > messages[messages.length-1].id) && (
                <ThinkingIndicator />
            )}
            
            <div ref={messagesEndRef} />
            </div>
        )}
      </main>

      {/* Input Area (Only visible in Chat mode) */}
      <footer className={`bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 transition-all duration-500 ${showLimitOverlay ? 'blur-sm select-none pointer-events-none' : ''} ${viewMode !== 'chat' ? 'hidden' : ''}`}>
        <div className="max-w-3xl mx-auto">
          {voiceError && (
             <div className="mb-2 mx-1 p-2 bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1">
                <AlertCircle size={16} />
                {voiceError}
             </div>
          )}
          <div className="flex items-end gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 dark:focus-within:border-emerald-500/50 transition-all">
            
            <div className="flex-shrink-0 mb-1 ml-1">
                <ImageUpload 
                    onImageSelected={setAttachment}
                    onClear={() => setAttachment(null)}
                    currentAttachment={attachment}
                    disabled={isLoading || showLimitOverlay}
                />
            </div>

            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachment ? "Add a question about this image..." : isListening ? "Listening..." : "Ask a question, explain a concept..."}
              className={`flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none max-h-32 py-3 px-2 leading-relaxed transition-colors ${isListening ? 'placeholder-rose-500' : ''}`}
              rows={1}
              disabled={isLoading || showLimitOverlay}
            />

            <button
              onClick={toggleListening}
              disabled={isLoading || showLimitOverlay}
              className={`p-2 rounded-full mb-2 mr-1 transition-all duration-300 ${
                isListening 
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 ring-2 ring-rose-400/50 animate-pulse' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Voice input"
              type="button"
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && !attachment) || isLoading || showLimitOverlay}
              className={`p-3 rounded-2xl mb-1 mr-1 flex-shrink-0 transition-all duration-200 ${
                (!inputText.trim() && !attachment) || isLoading || showLimitOverlay
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
            >
              <Send size={20} className={isLoading ? 'opacity-0' : ''} />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3">
            AI can make mistakes. Please double check important calculations.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;