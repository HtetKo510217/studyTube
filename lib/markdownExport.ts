import { StudySession } from './storage';

/**
 * Formats a duration in seconds to a HH:MM:SS or MM:SS string.
 */
export function formatTime(seconds: number): string {
  const roundedSeconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(roundedSeconds / 3600);
  const m = Math.floor((roundedSeconds % 3600) / 60);
  const s = roundedSeconds % 60;

  const parts: string[] = [];
  if (h > 0) {
    parts.push(h.toString());
    parts.push(m.toString().padStart(2, '0'));
  } else {
    parts.push(m.toString());
  }
  parts.push(s.toString().padStart(2, '0'));
  return parts.join(':');
}

/**
 * Generates the Markdown content for a study session.
 */
export function generateMarkdown(session: StudySession): string {
  const videoUrl = `https://www.youtube.com/watch?v=${session.videoId}`;
  const dateStr = new Date(session.lastUpdated || Date.now()).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let md = `# Study Notes: ${session.videoTitle || 'Untitled YouTube Video'}\n\n`;
  md += `- **Video**: [${videoUrl}](${videoUrl})\n`;
  md += `- **Date**: ${dateStr}\n`;
  if (session.studyGoal?.trim()) {
    md += `- **Study Goal**: ${session.studyGoal.trim()}\n`;
  }
  md += `\n---\n\n`;

  if (session.notes.length === 0) {
    md += `*No notes taken in this session.*\n`;
  } else {
    // Sort notes chronologically by timestamp
    const sortedNotes = [...session.notes].sort((a, b) => a.timestampSeconds - b.timestampSeconds);

    for (const note of sortedNotes) {
      const timeStr = formatTime(note.timestampSeconds);
      // Youtube deep-link format: https://youtu.be/VIDEO_ID?t=SECONDS
      const timestampLink = `https://youtu.be/${session.videoId}?t=${Math.floor(note.timestampSeconds)}`;
      md += `## [${timeStr}](${timestampLink})\n`;
      md += `${note.text.trim()}\n\n`;
    }
  }

  md += `---\n*Notes compiled using StudyTube. Locally persisted in-browser only.*\n`;
  return md;
}

/**
 * Generates and triggers a browser download for a .md file containing the study notes.
 */
export function exportNotesToMarkdown(session: StudySession): void {
  if (typeof window === 'undefined') return;

  try {
    const markdownContent = generateMarkdown(session);
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date(session.lastUpdated || Date.now())
      .toISOString()
      .split('T')[0];

    const filename = `study-notes-${session.videoId}-${dateStr}.md`;

    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.download = filename;
    
    document.body.appendChild(tempLink);
    tempLink.click();
    
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting notes to markdown:', error);
  }
}
