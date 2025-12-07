import React from 'react';
import { BrainCircuit } from 'lucide-react';

export const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-2xl rounded-tl-none self-start max-w-[80%] animate-pulse border border-indigo-100 dark:border-indigo-500/20">
      <BrainCircuit className="w-5 h-5 animate-pulse" />
      <span className="text-sm font-medium">Analyzing the problem deeply...</span>
    </div>
  );
};