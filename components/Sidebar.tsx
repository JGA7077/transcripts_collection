import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function Sidebar({ searchQuery }: { searchQuery?: string }) {
  const transcripts = await prisma.transcript.findMany({
    where: searchQuery ? {
      OR: [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { channelName: { contains: searchQuery, mode: 'insensitive' } },
        { category: { contains: searchQuery, mode: 'insensitive' } },
      ]
    } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      channelName: true,
      category: true,
      youtubeId: true
    }
  });

  return (
    <div className="w-80 h-screen bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="p-4 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight">Transcripts</h1>
        <p className="text-xs text-slate-500 mt-1">Sua coleção de conhecimento</p>
        
        <div className="mt-4">
          <form action="/" method="GET" className="relative group">
            <input 
              type="text" 
              name="search"
              defaultValue={searchQuery}
              placeholder="Buscar por título, canal..."
              className="w-full bg-slate-900 border-slate-800 rounded-lg py-2 pl-3 pr-10 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
            />
            <button className="absolute right-3 top-2.5 text-slate-600 group-focus-within:text-blue-500">
              🔍
            </button>
          </form>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {transcripts.map((t) => (
          <Link 
            key={t.id} 
            href={`/transcript/${t.id}`}
            className="block p-3 rounded-lg hover:bg-slate-900 transition-colors group"
          >
            <h3 className="text-sm font-medium text-slate-200 group-hover:text-blue-400 truncate">
              {t.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {t.channelName && (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded leading-none">
                  {t.channelName}
                </span>
              )}
              {t.category && (
                <span className="text-[10px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded leading-none">
                  {t.category}
                </span>
              )}
            </div>
          </Link>
        ))}

        {transcripts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-600">Nenhuma transcrição encontrada</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <Link 
          href="/import"
          className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
        >
          <span>➕ Importar Novo</span>
        </Link>
      </div>
    </div>
  );
}
