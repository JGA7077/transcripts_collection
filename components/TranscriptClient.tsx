"use client";

import { useEffect, useRef, useState } from "react";
import YT from "youtube";

interface Segment {
  id: string;
  start: number;
  end: number;
  content: string;
  translatedContent: string | null;
}

interface Transcript {
  id: string;
  youtubeId: string | null;
  title: string;
}

// Tipagem para a API do YouTube IFrame
declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  destroy: () => void;
}

interface YTStateChangeEvent {
  data: number;
}

export default function TranscriptClient({ 
  transcript, 
  segments 
}: { 
  transcript: Transcript, 
  segments: Segment[] 
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Load YouTube IFrame API
    if (typeof window !== "undefined" && !window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    }

    function initPlayer() {
      if (!transcript.youtubeId) return;
      
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: transcript.youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: YTStateChangeEvent) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              startSync();
            }
          }
        }
      });
    }


    let interval: ReturnType<typeof setInterval>;
    function startSync() {
      interval = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          const activeSegment = segments.find(
            s => currentTime >= s.start && currentTime <= s.end
          );
          if (activeSegment && activeSegment.id !== activeId) {
            setActiveId(activeSegment.id);
            // Auto-scroll to active segment
            const element = document.getElementById(`segment-${activeSegment.id}`);
            if (element && scrollRef.current) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }, 250);
    }

    return () => {
      clearInterval(interval);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [transcript.youtubeId, segments, activeId]);

  const handleSeek = (time: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true);
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Video Area */}
      <div className="lg:w-1/2 p-6 bg-black flex items-center justify-center">
        {transcript.youtubeId ? (
          <div className="w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <div id="youtube-player" className="w-full h-full"></div>
          </div>
        ) : (
          <div className="text-slate-500 text-center">
            <p className="text-4xl mb-4">🔇</p>
            <p>Este vídeo não possui um ID de YouTube válido.</p>
          </div>
        )}
      </div>

      {/* Transcript Area */}
      <div className="flex-1 bg-slate-900 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {segments.map((s) => (
          <div 
            key={s.id}
            id={`segment-${s.id}`}
            onClick={() => handleSeek(s.start)}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border ${
              activeId === s.id 
                ? "bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                : "bg-slate-800/50 border-slate-700 hover:bg-slate-800"
            }`}
          >
            <p className="text-slate-200 leading-relaxed font-medium">{s.content}</p>
            {s.translatedContent && (
              <p className="text-blue-400/80 text-sm mt-2 font-normal italic border-t border-slate-700/50 pt-2">
                {s.translatedContent}
              </p>
            )}
            <span className="text-[10px] text-slate-500 mt-2 block font-mono">
              {Math.floor(s.start / 60)}:{(s.start % 60).toFixed(0).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
