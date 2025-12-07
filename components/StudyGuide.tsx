import React, { useMemo } from 'react';
import { Trash2, BookOpen, Clock } from 'lucide-react';
import { SavedItem } from '../types';

interface StudyGuideProps {
  items: SavedItem[];
  onRemove: (id: string) => void;
  onBack: () => void;
}

export const StudyGuide: React.FC<StudyGuideProps> = ({ items, onRemove, onBack }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
          <BookOpen size={48} className="opacity-50" />
        </div>
        <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">Your Study Guide is Empty</h2>
        <p className="text-center max-w-md mb-6">
          Save important concepts, definitions, or complex solution steps from the chat to review them here later.
        </p>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
        >
          Return to Tutor
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BookOpen className="text-emerald-600" />
          Study Guide
        </h2>
        <span className="text-sm text-slate-500">{items.length} items saved</span>
      </div>

      <div className="grid gap-6">
        {items.map((item) => (
          <StudyCard key={item.id} item={item} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
};

const StudyCard: React.FC<{ item: SavedItem; onRemove: (id: string) => void }> = ({ item, onRemove }) => {
  // Reuse the rendering logic to properly display SVGs and formatting
  const renderedContent = useMemo(() => {
    const parts = item.content.split(/(```svg[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```svg') && part.endsWith('```')) {
        const svgContent = part
          .replace(/^```svg\s*/, '')
          .replace(/```$/, '');

        return (
          <div key={index} className="my-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4 flex justify-center">
            <div 
              className="w-full max-w-sm [&>svg]:w-full [&>svg]:h-auto text-slate-900 dark:text-slate-100"
              dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
          </div>
        );
      }
      
      if (!part) return null;
      return <span key={index}>{part}</span>;
    });
  }, [item.content]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 relative group">
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
        <Clock size={12} />
        {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
      </div>
      
      <div className="prose prose-sm max-w-none break-words whitespace-pre-wrap dark:prose-invert">
        {renderedContent}
      </div>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
          title="Remove from Study Guide"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};