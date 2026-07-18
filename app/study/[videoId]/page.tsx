'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoPanel from '@/components/VideoPanel';
import NotesPanel from '@/components/NotesPanel';
import { loadSession, saveSession, Note, StudySession } from '@/lib/storage';
import { fetchVideoMetadata } from '@/lib/youtube';
import { exportNotesToMarkdown } from '@/lib/markdownExport';

export default function StudySessionPage() {
  const params = useParams();
  const router = useRouter();
  const videoId = params?.videoId as string;

  const [notes, setNotes] = useState<Note[]>([]);
  const [studyGoal, setStudyGoal] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session from localStorage and fetch YouTube metadata
  useEffect(() => {
    if (!videoId) return;

    try {
      const existing = loadSession(videoId);
      if (existing) {
        setNotes(existing.notes || []);
        setStudyGoal(existing.studyGoal || '');
        setVideoTitle(existing.videoTitle || '');
      }

      // Fetch fresh metadata (specifically video title)
      fetchVideoMetadata(videoId).then((meta) => {
        if (meta && meta.title) {
          setVideoTitle(meta.title);
          
          // Persist the retrieved title
          const current = loadSession(videoId);
          const updated: StudySession = {
            videoId,
            videoTitle: meta.title,
            studyGoal: current?.studyGoal || '',
            notes: current?.notes || [],
            lastUpdated: Date.now(),
          };
          saveSession(updated);
        }
      });
    } catch (error) {
      console.error('Error loading study session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [videoId]);

  const handlePlayerReady = (playerInstance: any) => {
    setPlayer(playerInstance);
  };

  const handleStateChange = (state: number) => {
    // 1 is playing in YouTube IFrame Player API
    setIsPlaying(state === 1);
  };

  const handleAddNote = (text: string, timestampSeconds: number) => {
    const newNote: Note = {
      id: Math.random().toString(36).substring(2, 9),
      timestampSeconds,
      text,
      createdAt: Date.now(),
    };

    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);

    const updatedSession: StudySession = {
      videoId,
      videoTitle,
      studyGoal,
      notes: updatedNotes,
      lastUpdated: Date.now(),
    };
    saveSession(updatedSession);
  };

  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    setNotes(updatedNotes);

    const updatedSession: StudySession = {
      videoId,
      videoTitle,
      studyGoal,
      notes: updatedNotes,
      lastUpdated: Date.now(),
    };
    saveSession(updatedSession);
  };

  const handleUpdateNote = (id: string, text: string) => {
    const updatedNotes = notes.map((note) =>
      note.id === id ? { ...note, text, createdAt: Date.now() } : note
    );
    setNotes(updatedNotes);

    const updatedSession: StudySession = {
      videoId,
      videoTitle,
      studyGoal,
      notes: updatedNotes,
      lastUpdated: Date.now(),
    };
    saveSession(updatedSession);
  };

  const handleUpdateGoal = (newGoal: string) => {
    setStudyGoal(newGoal);

    const updatedSession: StudySession = {
      videoId,
      videoTitle,
      studyGoal: newGoal,
      notes,
      lastUpdated: Date.now(),
    };
    saveSession(updatedSession);
  };

  const handleExportMarkdown = () => {
    const currentSession: StudySession = {
      videoId,
      videoTitle,
      studyGoal,
      notes,
      lastUpdated: Date.now(),
    };
    exportNotesToMarkdown(currentSession);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold tracking-wide">Loading your workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-550 transition-colors duration-300">
      
      {/* Header */}
      <header className="h-16 shrink-0 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 backdrop-blur-md flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/"
            title="Go back to dashboard"
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors mr-2 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[280px] sm:max-w-[400px] md:max-w-[600px]">
              {videoTitle || 'Study Session'}
            </h1>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium font-mono">
              ID: {videoId}
            </span>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[10px] text-amber-600 dark:text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md font-semibold font-mono">
            ⚠️ Storage: Local In-Browser
          </span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden p-4 md:p-6 gap-4 md:gap-6">
        
        {/* Left Column: NotesPanel (Order-2 on mobile, Order-1 on desktop) */}
        <div className="w-full md:w-[40%] flex flex-col h-auto md:h-full order-2 md:order-1 min-w-[320px] shrink-0">
          <NotesPanel
            notes={notes}
            studyGoal={studyGoal}
            player={player}
            isPlaying={isPlaying}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
            onUpdateNote={handleUpdateNote}
            onExportMarkdown={handleExportMarkdown}
            onUpdateGoal={handleUpdateGoal}
          />
        </div>

        {/* Right Column: VideoPanel + Tips (Order-1 on mobile, Order-2 on desktop) */}
        <div className="w-full md:w-[60%] flex flex-col gap-4 order-1 md:order-2">
          
          <div className="sticky top-0 md:relative">
            <VideoPanel
              videoId={videoId}
              onPlayerReady={handlePlayerReady}
              onStateChange={handleStateChange}
            />
          </div>

          {/* Quick Shortcuts / Tips Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 shadow-sm leading-relaxed">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              Workspace Shortcuts & Tips
            </h3>
            <ul className="text-xs space-y-1.5 text-zinc-650 dark:text-zinc-400">
              <li className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-250 dark:border-zinc-700 font-mono text-[10px] font-bold">Ctrl + Enter</kbd>
                <span>Save your active note and automatically resume the video.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Typing will capture the exact video timestamp and auto-pause playback.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Click any note timestamp to jump the video directly to that moment.</span>
              </li>
            </ul>
          </div>
          
          <div className="block sm:hidden text-center p-2">
            <span className="text-[10px] text-amber-600 dark:text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-semibold">
              ⚠️ Notes stored locally
            </span>
          </div>

        </div>

      </main>
      
    </div>
  );
}
