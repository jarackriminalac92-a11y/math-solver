import React, { useMemo, useState } from 'react';
import { User, Bot, HelpCircle, Image as ImageIcon, Copy, Check, Lightbulb, Bookmark } from 'lucide-react';
import { ChatMessage } from '../types';

interface MessageBubbleProps {
  message: ChatMessage;
  showGiveUpButton?: boolean;
  onGiveUp?: () => void;
  onExplainConcept?: () => void;
  onSaveToGuide?: (text: string) => void;
  isSaved?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  showGiveUpButton, 
  onGiveUp, 
  onExplainConcept,
  onSaveToGuide,
  isSaved
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Function to parse text and separate SVG code blocks
  const renderedContent = useMemo(() => {
    // Regex matches ```svg ... ``` blocks including newlines
    const parts = message.text.split(/(```svg[\s\S]*?```)/g);

    return parts.map((part, index) => {
      // If it is an SVG block
      if (part.startsWith('```svg') && part.endsWith('```')) {
        // Extract content between fences
        const svgContent = part
          .replace(/^```svg\s*/, '') // Remove opening fence
          .replace(/```$/, '');      // Remove closing fence

        return (
          <div key={index} className="my-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 flex justify-center shadow-sm">
            <div 
              className="w-full max-w-sm [&>svg]:w-full [&>svg]:h-auto text-slate-900 dark:text-slate-100"
              dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
          </div>
        );
      }
      
      // Return normal text part
      if (!part) return null;
      return <span key={index}>{part}</span>;
    });
  }, [message.text]);

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-slate-800 dark:bg-slate-700 text-white' : 'bg-emerald-600 text-white'}`}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}>
            {/* Bubble */}
            <div 
              className={`flex flex-col p-4 rounded-2xl shadow-sm ${
                isUser 
                  ? 'bg-slate-800 dark:bg-slate-700 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
              }`}
            >
              {message.image && (
                <div className="mb-3 overflow-hidden rounded-lg border border-white/20">
                  <img src={message.image} alt="Uploaded content" className="max-h-64 object-contain w-full bg-slate-900/50" />
                </div>
              )}
              
              <div className={`prose prose-sm max-w-none break-words whitespace-pre-wrap leading-relaxed ${isUser ? 'prose-invert' : 'dark:prose-invert'}`}>
                {renderedContent}
              </div>

              {/* Action Bar for Model messages */}
              {!isUser && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                   {onSaveToGuide && (
                     <button
                        onClick={() => onSaveToGuide(message.text)}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                            isSaved 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                        }`}
                        title={isSaved ? "Saved to Study Guide" : "Save to Study Guide"}
                     >
                        <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
                        {isSaved ? 'Saved' : 'Save'}
                     </button>
                   )}
                   <div className="h-3 w-px bg-slate-200 dark:bg-slate-700"></div>
                   <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      title="Copy solution"
                   >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                   </button>
                </div>
              )}
            </div>

            {/* Action Buttons (Give Up / Explain Concept) */}
            {showGiveUpButton && (
                <div className="mt-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1">
                    <button
                        onClick={onExplainConcept}
                        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-full transition-colors border border-indigo-100 dark:border-indigo-500/30"
                    >
                        <Lightbulb size={12} />
                        Explain Concept
                    </button>
                    <button
                        onClick={onGiveUp}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1.5 rounded-full transition-colors border border-slate-200 dark:border-slate-700"
                    >
                        <HelpCircle size={12} />
                        Just Show Me The Answer
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};