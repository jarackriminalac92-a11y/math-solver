import React, { useRef, useState } from 'react';
import { Trash2, Calculator, Plus, ArrowRight, Loader2, Camera } from 'lucide-react';
import { ProblemItem, Attachment } from '../types';

interface ProblemListProps {
  items: ProblemItem[];
  onRemove: (id: string) => void;
  onSelect: (item: ProblemItem) => void;
  onAdd: (attachment: Attachment) => Promise<void>;
}

export const ProblemList: React.FC<ProblemListProps> = ({ items, onRemove, onSelect, onAdd }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const cleanBase64 = base64String.split(',')[1];
      
      try {
        await onAdd({
            file,
            previewUrl: base64String,
            base64: cleanBase64,
            mimeType: file.type
        });
      } catch (e) {
        alert("Failed to extract problem from image.");
      } finally {
        setIsProcessing(false);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4 relative">
          <Calculator size={48} className="opacity-50" />
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5">
            <Plus size={16} />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">No Problems Saved</h2>
        <p className="text-center max-w-md mb-6">
          Scan math problems from images to build your own "To Solve" list. 
          Pick one later to work through with the tutor.
        </p>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <Camera size={18} />
          Scan Problem
        </button>
        <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Calculator className="text-emerald-600" />
          Problems to Solve
        </h2>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {isProcessing ? "Analyzing..." : "Add New"}
        </button>
        <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex gap-4 group hover:shadow-md transition-all">
            <div className="w-24 h-24 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                <img 
                    src={`data:${item.mimeType};base64,${item.image}`} 
                    alt="Problem" 
                    className="w-full h-full object-cover"
                />
            </div>
            
            <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                    <div className="text-xs text-slate-400 mb-1">
                        {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 font-medium">
                        {item.text}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-3">
                    <button 
                        onClick={() => onRemove(item.id)}
                        className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                    <button 
                        onClick={() => onSelect(item)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full transition-colors"
                    >
                        Solve Now
                        <ArrowRight size={12} />
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};