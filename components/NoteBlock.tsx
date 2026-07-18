'use client';

import { useState } from 'react';
import { Note } from '@/lib/storage';
import { formatTime } from '@/lib/markdownExport';

interface NoteBlockProps {
  note: Note;
  onSeek: (seconds: number) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
}

export default function NoteBlock({ note, onSeek, onDelete, onUpdate }: NoteBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);

  const handleSave = () => {
    if (editText.trim() === '') {
      onDelete(note.id);
    } else {
      onUpdate(note.id, editText);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm transition-all duration-200 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 group">
      <div className="flex items-center justify-between gap-4 mb-2">
        <button
          onClick={() => onSeek(note.timestampSeconds)}
          title="Jump video to this timestamp"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/40 rounded-lg transition-colors border border-violet-100 dark:border-violet-900/20"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatTime(note.timestampSeconds)}
        </button>

        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditText(note.text);
                  setIsEditing(false);
                }}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(note.id)}
                className="text-xs font-medium text-rose-500 hover:text-rose-700 transition-colors"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="w-full text-sm p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y text-zinc-800 dark:text-zinc-200"
        />
      ) : (
        <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {note.text}
        </p>
      )}
      
      <div className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500 text-right">
        {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
