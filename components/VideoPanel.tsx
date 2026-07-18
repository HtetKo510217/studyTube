'use client';

import { useEffect, useRef } from 'react';
import { loadYouTubeIframeAPI } from '@/lib/youtube';

interface VideoPanelProps {
  videoId: string;
  onPlayerReady: (player: any) => void;
  onStateChange?: (state: number) => void;
}

export default function VideoPanel({ videoId, onPlayerReady, onStateChange }: VideoPanelProps) {
  const playerRef = useRef<any>(null);
  const containerId = 'study-tube-iframe-player';

  useEffect(() => {
    let isMounted = true;

    async function initPlayer() {
      // Load IFrame API
      await loadYouTubeIframeAPI();
      
      if (!isMounted) return;

      const YT = (window as any).YT;
      if (!YT) {
        console.error('YouTube IFrame API loaded but YT global not found.');
        return;
      }

      // If player already exists, destroy it before creating a new one
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying previous player:', e);
        }
        playerRef.current = null;
      }

      try {
        playerRef.current = new YT.Player(containerId, {
          videoId: videoId,
          playerVars: {
            rel: 0,
            enablejsapi: 1,
            autoplay: 0,
            modestbranding: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              if (isMounted) {
                onPlayerReady(event.target);
              }
            },
            onStateChange: (event: any) => {
              if (isMounted && onStateChange) {
                onStateChange(event.data);
              }
            },
          },
        });
      } catch (error) {
        console.error('Error initializing YouTube Player:', error);
      }
    }

    initPlayer();

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore destroy errors on unmount
        }
        playerRef.current = null;
      }
    };
  }, [videoId]); // Re-initialize player if the videoId changes

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl relative group">
      <div id={containerId} className="w-full h-full absolute inset-0" />
    </div>
  );
}
