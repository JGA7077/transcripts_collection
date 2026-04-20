import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import TranscriptClient from "@/components/TranscriptClient";

export default async function TranscriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const transcript = await prisma.transcript.findUnique({
    where: { id },
    include: {
      segments: {
        orderBy: { start: "asc" },
      },
    },
  });

  if (!transcript) {
    notFound();
  }

  return (
    <div className="h-full flex flex-col">
      <header className="p-6 border-b border-slate-800 bg-black/40 backdrop-blur-md">
        <h1 className="text-2xl font-bold text-white">{transcript.title}</h1>
        <div className="flex items-center gap-4 mt-2">
          {transcript.channelName && (
            <span className="text-sm text-slate-400">📺 {transcript.channelName}</span>
          )}
          {transcript.category && (
            <span className="text-sm text-blue-400 font-medium">#{transcript.category}</span>
          )}
          <span className="text-sm text-slate-500">
            {transcript.sourceLanguage.toUpperCase()} → {transcript.targetLanguage.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <TranscriptClient transcript={transcript} segments={transcript.segments} />
      </div>
    </div>
  );
}
