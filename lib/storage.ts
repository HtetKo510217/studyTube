/**
 * Helper library for persistence using localStorage.
 */

export interface Note {
  id: string;
  timestampSeconds: number;
  text: string;
  createdAt: number;
}

export interface StudySession {
  videoId: string;
  videoTitle?: string;
  studyGoal?: string;
  notes: Note[];
  lastUpdated: number;
}

const STORAGE_KEY_PREFIX = 'study-tube:session:';

/**
 * Gets the localStorage key for a specific video session.
 */
export function getSessionKey(videoId: string): string {
  return `${STORAGE_KEY_PREFIX}${videoId}`;
}

/**
 * Saves a study session to localStorage.
 */
export function saveSession(session: StudySession): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getSessionKey(session.videoId);
    window.localStorage.setItem(key, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving study session to localStorage:', error);
  }
}

/**
 * Loads a study session from localStorage by video ID.
 */
export function loadSession(videoId: string): StudySession | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = getSessionKey(videoId);
    const data = window.localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as StudySession;
  } catch (error) {
    console.error('Error loading study session from localStorage:', error);
    return null;
  }
}

/**
 * Clears a study session from localStorage.
 */
export function clearSession(videoId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getSessionKey(videoId);
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing study session from localStorage:', error);
  }
}
