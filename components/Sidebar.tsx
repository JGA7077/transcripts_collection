import Link from "next/link";
import prisma from "@/lib/prisma";
import TagList from "./TagList";
import SearchInput from "./SearchInput";

interface transcript {
  categories: string[],
  id: string,
  title: string,
  channelName: string | null,
  youtubeId: string | null,
}

export default async function Sidebar({ 
  searchQuery,
  selectedTags = []
}: { 
  searchQuery?: string,
  selectedTags?: string[]
}) {
  // Buscar todas as categorias únicas do banco
  const allTranscripts = await prisma.transcript.findMany({
    select: { categories: true }
  });
  
  const rawTags: string[] = allTranscripts.flatMap((t: { categories: string[] }) => t.categories);
  const uniqueTags: string[] = Array.from(new Set(rawTags)).sort();

  const transcripts = await prisma.transcript.findMany({
    where: {
      AND: [
        searchQuery ? {
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { channelName: { contains: searchQuery, mode: 'insensitive' } },
          ]
        } : {},
        selectedTags.length > 0 ? {
          categories: { hasSome: selectedTags }
        } : {}
      ]
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      channelName: true,
      categories: true,
      youtubeId: true
    }
  });

  return (
    <div className="w-full h-full bg-slate-950 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <Link href="/">
          <h1 className="text-xl font-bold text-white tracking-tight">Transcripts</h1>
        </Link>
        <p className="text-xs text-slate-500 mt-1">Sua coleção de conhecimento</p>
        
        <div className="mt-4">
          <SearchInput defaultValue={searchQuery} selectedTags={selectedTags} />
        </div>
      </div>

      <TagList 
        uniqueTags={uniqueTags} 
        selectedTags={selectedTags} 
        searchQuery={searchQuery} 
      />



      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {transcripts.map((transcript: transcript) => (
          <Link 
            key={transcript.id} 
            href={`/transcript/${transcript.id}`}
            className="block p-3 rounded-lg hover:bg-slate-900 transition-colors group"
          >
            <h3 className="text-sm font-medium text-slate-200 group-hover:text-blue-400 truncate">
              {transcript.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {transcript.channelName && (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded leading-none">
                  {transcript.channelName}
                </span>
              )}
              <div className="flex gap-1 flex-wrap">
                {transcript.categories && transcript.categories.slice(0, 2).map((cat: string, i: number) => (
                  <span key={i} className="text-[10px] text-blue-500/70">
                    #{cat}
                  </span>
                ))}
                {transcript.categories.length > 2 && (
                  <span className="text-[10px] text-slate-600">+{transcript.categories.length - 2}</span>
                )}
              </div>
            </div>
          </Link>
        ))}

        {transcripts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-600">Nenhuma transcrição encontrada</p>
          </div>
        )}
      </div>

        {process.env.ALLOW_IMPORT === "true" && (
          <div className="p-4 border-t border-slate-800 bg-slate-950">
            <Link 
              href="/import"
              className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
            >
              <span>➕ Importar Novo</span>
            </Link>
          </div>
        )}
      </div>
  );
}



