/**
 * Utility library for interacting with YouTube API and processing URLs.
 */

// Extend window interface for YouTube IFrame Player API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

/**
 * Extracts the 11-character YouTube video ID from various URL formats or returns the input if it's already an ID.
 * @param urlOrId The YouTube URL or raw video ID
 */
export function extractVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;

  const trimmed = urlOrId.trim();

  // If it's already a clean 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex patterns for different YouTube URL styles
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/, // standard watch URL
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,                     // short link
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,           // embed URL
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/           // shorts link
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Interface for oEmbed metadata returned by YouTube
 */
export interface YouTubeMetadata {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

/**
 * Fetches video metadata via YouTube's public oEmbed endpoint.
 * This is free and does not require an API key.
 * @param videoId The 11-character video ID
 */
export async function fetchVideoMetadata(videoId: string): Promise<YouTubeMetadata | null> {
  if (!videoId) return null;

  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch YouTube oEmbed data: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      title: data.title,
      author_name: data.author_name,
      thumbnail_url: data.thumbnail_url,
    };
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    return null;
  }
}

let apiLoadingPromise: Promise<void> | null = null;

/**
 * Dynamically loads the YouTube IFrame Player API script.
 * Returns a promise that resolves when YT global and player functions are ready.
 */
export function loadYouTubeIframeAPI(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  // Already loaded
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  // Loading in progress
  if (apiLoadingPromise) {
    return apiLoadingPromise;
  }

  apiLoadingPromise = new Promise<void>((resolve) => {
    // Create or chain the global callback
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousReady) {
        try {
          previousReady();
        } catch (e) {
          console.error(e);
        }
      }
      resolve();
    };

    // Inject the YouTube IFrame API script tag
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }
  });

  return apiLoadingPromise;
}
