'use client';

import { useState, useRef, useEffect } from 'react';
import { Note } from '@/lib/storage';
import NoteBlock from './NoteBlock';
import { formatTime } from '@/lib/markdownExport';

interface NotesPanelProps {
  notes: Note[];
  studyGoal?: string;
  player: any;
  isPlaying: boolean;
  onAddNote: (text: string, timestampSeconds: number) => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (id: string, text: string) => void;
  onExportMarkdown: () => void;
  onUpdateGoal?: (goal: string) => void;
}

export default function NotesPanel({
  notes,
  studyGoal = '',
  player,
  isPlaying,
  onAddNote,
  onDeleteNote,
  onUpdateNote,
  onExportMarkdown,
  onUpdateGoal,
}: NotesPanelProps) {
  const [noteText, setNoteText] = useState('');
  const [capturedTime, setCapturedTime] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalText, setGoalText] = useState(studyGoal);

  const wasPlayingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal goal text with prop changes
  useEffect(() => {
    setGoalText(studyGoal);
  }, [studyGoal]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);

    // If text was empty and user just started typing, capture timestamp and pause
    if (text.length > 0 && capturedTime === null) {
      let time = 0;
      if (player && typeof player.getCurrentTime === 'function') {
        time = player.getCurrentTime();
      }
      setCapturedTime(time);

      // Record whether video was playing, and pause it once
      const videoPlaying = isPlaying || (player && typeof player.getPlayerState === 'function' && player.getPlayerState() === 1);
      wasPlayingRef.current = !!videoPlaying;

      if (videoPlaying && player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
    }

    // If text is cleared, reset captured timestamp
    if (text.length === 0) {
      setCapturedTime(null);
      setIsTyping(false);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return;
    }

    // Reset/start the 2.5s debounce timer
    setIsTyping(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2500);
  };

  const handleManualStamp = () => {
    if (player && typeof player.getCurrentTime === 'function') {
      setCapturedTime(player.getCurrentTime());
    }
  };

  const handleSubmit = () => {
    if (noteText.trim() === '') return;

    const finalTime = capturedTime !== null ? capturedTime : (player && typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0);
    onAddNote(noteText.trim(), finalTime);

    // Reset local typing states
    setNoteText('');
    setCapturedTime(null);
    setIsTyping(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Auto-resume if the video was playing before typing started
    if (wasPlayingRef.current && player && typeof player.playVideo === 'function') {
      player.playVideo();
    }
    wasPlayingRef.current = false;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleResumeVideo = () => {
    if (player && typeof player.playVideo === 'function') {
      player.playVideo();
    }
  };

  const handleSaveGoal = () => {
    if (onUpdateGoal) {
      onUpdateGoal(goalText);
    }
    setIsEditingGoal(false);
  };

  // Filter and sort notes
  const filteredNotes = notes.filter((note) =>
    note.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    return sortAsc
      ? a.timestampSeconds - b.timestampSeconds
      : b.timestampSeconds - a.timestampSeconds;
  });

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 overflow-hidden shadow-md">
      
      {/* Session Title & Study Goal */}
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Study Workspace</h2>
          <button
            onClick={onExportMarkdown}
            disabled={notes.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Notes
          </button>
        </div>

        {/* Goal Section */}
        <div className="text-sm">
          {isEditingGoal ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="What is your goal for this session?"
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-850 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-zinc-800 dark:text-zinc-200"
                maxLength={100}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
              />
              <button
                onClick={handleSaveGoal}
                className="px-2.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setGoalText(studyGoal);
                  setIsEditingGoal(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4 p-2.5 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-100 dark:border-zinc-800/40">
              <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-0.5">Study Goal</span>
                <p className="text-zinc-700 dark:text-zinc-350 font-medium italic">
                  {studyGoal.trim() ? studyGoal : 'No study goal defined for this session.'}
                </p>
              </div>
              {onUpdateGoal && (
                <button
                  onClick={() => setIsEditingGoal(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-4 cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note Composition Block */}
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/20">
        <div className="relative">
          <textarea
            value={noteText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a note... (video pauses automatically while typing, Ctrl+Enter to save & resume)"
            className="w-full min-h-[96px] p-3.5 pb-10 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-zinc-800 dark:text-zinc-200 shadow-inner resize-none transition-shadow"
          />
          
          <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
            {isTyping && (
              <span className="flex items-center gap-1 text-amber-500 animate-pulse font-semibold">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block" />
                Auto-paused
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualStamp}
              title="Capture current video timestamp"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-750 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {capturedTime !== null ? `Stamp: ${formatTime(capturedTime)}` : 'Stamp Current Time'}
            </button>

            {capturedTime !== null && (
              <button
                onClick={() => setCapturedTime(null)}
                className="p-1.5 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                title="Clear stamp"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isPlaying && player && (
              <button
                onClick={handleResumeVideo}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-755 rounded-lg border border-zinc-200 dark:border-zinc-750 transition-colors cursor-pointer"
              >
                Resume Video
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={noteText.trim() === ''}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>

      {/* Search and Sort controls */}
      <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-800 dark:text-zinc-200"
          />
          <svg
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </span>
          
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Sort: {sortAsc ? 'Chronological' : 'Reverse'}
          </button>
        </div>
      </div>

      {/* Notes List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[calc(100vh-420px)] md:max-h-[calc(100vh-320px)] lg:max-h-[calc(100vh-340px)]">
        {sortedNotes.length > 0 ? (
          sortedNotes.map((note) => (
            <NoteBlock
              key={note.id}
              note={note}
              onSeek={(sec) => {
                if (player && typeof player.seekTo === 'function') {
                  player.seekTo(sec, true);
                }
              }}
              onDelete={onDeleteNote}
              onUpdate={onUpdateNote}
            />
          ))
        ) : (
          <div className="text-center py-10 px-4">
            <svg className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-550">
              {searchQuery ? 'No notes match your search.' : 'Start taking notes above to fill your workspace!'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
