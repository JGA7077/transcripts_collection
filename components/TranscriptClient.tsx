"use client";

import { useEffect, useRef, useState } from "react";

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
    YT: {
      Player: any;
      PlayerState: {
        PLAYING: number;
      };
    };
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
  const [showTranslation, setShowTranslation] = useState(true);
  const playerRef = useRef<YTPlayer | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
// ... [Mantenha os useEffects existentes] ...


  // Efeito 1: Inicialização do Player (Roda apenas quando o ID do vídeo muda)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!transcript.youtubeId || playerRef.current) return;
      
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: transcript.youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
        },
        events: {
          onStateChange: (event: YTStateChangeEvent) => {
            // No-op aqui, o sincronismo roda em intervalo
          }
        }
      });
    };

    window.onYouTubeIframeAPIReady = initPlayer;

    if (window.YT && window.YT.Player) {
      initPlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [transcript.youtubeId]);

  // Efeito 2: Sincronização (Intervalo constante)
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime();
        const activeSegment = segments.find(
          s => currentTime >= s.start && currentTime <= s.end
        );

        if (activeSegment && activeSegment.id !== activeIdRef.current) {
          activeIdRef.current = activeSegment.id;
          setActiveId(activeSegment.id);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [segments]);

  // Efeito 3: Auto-scroll (Roda quando o ID ativo muda)
  useEffect(() => {
    if (activeId) {
      const element = document.getElementById(`segment-${activeId}`);
      if (element && scrollRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeId]);


  const handleSeek = (time: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true);
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden">
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
      <div className="flex-1 bg-slate-900 flex flex-col min-h-0">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20 backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Transcrição</span>
          <button 
            onClick={() => setShowTranslation(!showTranslation)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              showTranslation 
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                : "bg-slate-800 text-slate-500 border border-slate-700"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showTranslation ? "bg-blue-500 animate-pulse" : "bg-slate-600"}`}></span>
            Tradução: {showTranslation ? "Visível" : "Oculta"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
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
              {showTranslation && s.translatedContent && (
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
    </div>
  );
}

