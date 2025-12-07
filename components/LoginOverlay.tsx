import React, { useState } from 'react';
import { Lock, ArrowRight, GraduationCap } from 'lucide-react';

interface LoginOverlayProps {
  onLogin: (key: string) => boolean;
  purchaseUrl?: string;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ onLogin, purchaseUrl = "#" }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(inputKey);
    if (!success) {
      setError('Invalid Key.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 font-sans bg-slate-950/80 backdrop-blur-md transition-all duration-700 animate-in fade-in">
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 md:p-10 ring-1 ring-white/10">
          <div className="flex justify-center mb-8">
            <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 shadow-inner">
              <Lock className="w-8 h-8 text-indigo-400" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Limit Reached</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Enter VIP Key to continue using the Premium Math Solver.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="access-key" className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                VIP Access Key
              </label>
              <input
                id="access-key"
                type="password"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setError('');
                }}
                placeholder="PASS-2025"
                className="w-full bg-slate-950 border border-slate-700 text-white placeholder-slate-600 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-center tracking-widest font-mono shadow-inner"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-rose-400 text-xs text-center font-medium bg-rose-950/30 py-3 px-4 rounded-lg border border-rose-900/50">
                {error}{' '}
                <span className="opacity-90">Purchase access at </span>
                <a 
                  href={purchaseUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="underline hover:text-rose-200 font-bold transition-colors"
                >
                  this link
                </a>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl py-3.5 transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 group border border-white/10"
            >
              <span>Unlock Access</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
             <div className="inline-flex items-center gap-2 text-slate-500 text-xs font-medium">
                <GraduationCap className="w-4 h-4" />
                <span>University Entrance Prep Edition</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};