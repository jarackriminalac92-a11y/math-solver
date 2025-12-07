import React, { useEffect, useState } from 'react';
import { Trophy, Target, TrendingUp, AlertTriangle, RefreshCw, BarChart2 } from 'lucide-react';
import { ProgressReport, ChatMessage } from '../types';
import { generateProgressReport } from '../services/geminiService';

interface ProgressDashboardProps {
  history: ChatMessage[];
  savedReport: ProgressReport | null;
  onUpdateReport: (report: ProgressReport) => void;
  onBack: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ history, savedReport, onUpdateReport, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ProgressReport | null>(savedReport);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const newReport = await generateProgressReport(history);
      setReport(newReport);
      onUpdateReport(newReport);
    } catch (error) {
      console.error("Failed to analyze progress", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-analyze if no report exists and there is enough history
  useEffect(() => {
    if (!report && history.length >= 4 && !loading) {
        handleAnalyze();
    }
  }, []);

  if (!report && history.length < 4) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full mb-4">
            <BarChart2 size={48} className="opacity-50" />
            </div>
            <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">Not Enough Data</h2>
            <p className="text-center max-w-md mb-6">
            Start solving problems with the tutor. Once you have a few interactions, check back here to see your progress analysis!
            </p>
            <button 
            onClick={onBack}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
            >
            Start Learning
            </button>
        </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="text-emerald-600" />
          Progress & Mastery
        </h2>
        
        <button 
          onClick={handleAnalyze}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Analyzing..." : "Refresh Analysis"}
        </button>
      </div>

      {report ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Overview Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-indigo-100 font-medium mb-1 flex items-center gap-2">
                            <Trophy size={18} />
                            Overall Feedback
                        </h3>
                        <p className="text-xl font-semibold leading-relaxed">
                            "{report.overallFeedback}"
                        </p>
                    </div>
                    <div className="text-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="text-3xl font-bold">{report.totalProblemsSolved}</div>
                        <div className="text-xs text-indigo-200 uppercase tracking-wider font-medium">Problems</div>
                    </div>
                </div>
            </div>

            {/* Mastered Concepts */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                        <Target size={20} />
                    </div>
                    Concepts Mastered
                </h3>
                {report.mastered.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {report.mastered.map((concept, i) => (
                            <span key={i} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium border border-emerald-100 dark:border-emerald-800">
                                {concept}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm italic">No concepts mastered yet. Keep practicing!</p>
                )}
            </div>

            {/* Areas for Improvement */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg">
                        <AlertTriangle size={20} />
                    </div>
                    Needs Practice
                </h3>
                {report.struggling.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {report.struggling.map((concept, i) => (
                            <span key={i} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-full text-sm font-medium border border-rose-100 dark:border-rose-800">
                                {concept}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm italic">No struggling areas detected. Great job!</p>
                )}
            </div>

            <div className="md:col-span-2 text-center">
                 <p className="text-xs text-slate-400">
                    Analysis based on current chat history. Last updated: {new Date(report.lastUpdated).toLocaleString()}
                 </p>
            </div>
          </div>
      ) : (
          <div className="flex justify-center py-12">
              <div className="animate-pulse text-slate-400 flex flex-col items-center gap-2">
                  <RefreshCw className="animate-spin" />
                  <span>Generating your progress report...</span>
              </div>
          </div>
      )}
    </div>
  );
};