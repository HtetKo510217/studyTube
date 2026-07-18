'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { extractVideoId } from '@/lib/youtube';
import { loadSession, saveSession, StudySession } from '@/lib/storage';

export default function Home() {
  const [url, setUrl] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Please enter a valid YouTube URL (e.g., youtube.com/watch?v=... or youtu.be/...)');
      return;
    }

    setIsLoading(true);

    try {
      // Load existing session if any, or start a new one
      const existingSession = loadSession(videoId);
      
      const updatedSession: StudySession = {
        videoId,
        videoTitle: existingSession?.videoTitle || '',
        studyGoal: goal.trim() ? goal.trim() : (existingSession?.studyGoal || ''),
        notes: existingSession?.notes || [],
        lastUpdated: Date.now(),
      };

      saveSession(updatedSession);
      router.push(`/study/${videoId}`);
    } catch (err) {
      console.error(err);
      setError('An error occurred while setting up your session. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex flex-col items-center justify-center p-6 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      
      <main className="w-full max-w-xl bg-white dark:bg-zinc-900/60 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 p-8 md:p-10 shadow-2xl backdrop-blur-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 border border-indigo-200 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            StudyTube
          </h1>
          <p className="text-sm text-zinc-550 dark:text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Boost your learning. Side-by-side video notes, auto-pausing on typing, and instant markdown exports.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* YouTube URL input */}
          <div className="space-y-1.5">
            <label htmlFor="url" className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              YouTube Video URL or ID
            </label>
            <div className="relative">
              <input
                id="url"
                type="text"
                required
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent text-sm text-zinc-800 dark:text-zinc-100 transition-all shadow-inner"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Study Goal input */}
          <div className="space-y-1.5">
            <label htmlFor="goal" className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Session Study Goal <span className="text-[10px] lowercase font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                id="goal"
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Learn recursion in JavaScript"
                maxLength={100}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent text-sm text-zinc-800 dark:text-zinc-100 transition-all shadow-inner"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs font-medium text-rose-500 bg-rose-50 dark:bg-rose-955/20 border border-rose-100 dark:border-rose-900/30 p-3 rounded-xl">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg hover:shadow-indigo-500/10 dark:hover:shadow-none transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Loading Session...</span>
              </>
            ) : (
              <>
                <span>Start Study Session</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Explainer */}
        <div className="mt-8 pt-6 border-t border-zinc-150 dark:border-zinc-800/80 text-center">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            🔒 Notes are stored locally in your browser cache. No sign-ups. No tracking.
          </p>
        </div>

      </main>
    </div>
  );
}
