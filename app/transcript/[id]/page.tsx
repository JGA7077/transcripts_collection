import { notFound } from "next/navigation";
import Link from "next/link";
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
      <header className="p-6 border-b border-slate-800 bg-black/40 backdrop-blur-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">{transcript.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {transcript.channelName && (
              <span className="text-sm text-slate-400">📺 {transcript.channelName}</span>
            )}
            <div className="flex gap-2">
              {transcript.categories !== undefined && transcript.categories.map((cat, i) => (
                <span key={i} className="text-xs bg-blue-900/30 text-blue-400 font-medium px-2 py-0.5 rounded">
                  #{cat}
                </span>
              ))}
            </div>
            <span className="text-sm text-slate-500 ml-2">
              {transcript.sourceLanguage.toUpperCase()} → {transcript.targetLanguage.toUpperCase()}
            </span>
          </div>
        </div>
        
        <Link 
          href={`/transcript/${id}/edit`}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-all flex items-center gap-2"
        >
          ✏️ Editar
        </Link>
      </header>


      <div className="flex-1 overflow-hidden">
        <TranscriptClient transcript={transcript} segments={transcript.segments} />
      </div>
    </div>
  );
}
