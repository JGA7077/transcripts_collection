import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function Home({ 
  searchParams 
}: { 
  searchParams: Promise<{ search?: string }> 
}) {
  const { search } = await searchParams;
  const count = await prisma.transcript.count();

  // Se houver busca, procuramos em títulos e também dentro dos segmentos
  const searchResults = search ? await prisma.transcript.findMany({
    where: {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { channelName: { contains: search, mode: 'insensitive' } },
        { categories: { hasSome: [search] } },
        { segments: { some: { content: { contains: search, mode: 'insensitive' } } } }
      ]
    },
    include: {
      _count: { select: { segments: true } }
    },
    orderBy: { createdAt: "desc" },
  }) : [];

  const recent = await prisma.transcript.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col items-center min-h-[80vh] p-8">
      {search ? (
        <div className="w-full max-w-4xl text-left">
          <h1 className="text-2xl font-bold mb-6 text-slate-200">
            Resultados para: <span className="text-blue-400">"{search}"</span>
          </h1>
          
          <div className="grid gap-4">
            {searchResults.map((t) => (
              <Link 
                key={t.id} 
                href={`/transcript/${t.id}`}
                className="group block p-6 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-blue-500 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {t.title}
                    </h3>
                    <div className="flex gap-3 mt-2">
                      {t.channelName && (
                        <span className="text-xs text-slate-400">📺 {t.channelName}</span>
                      )}
                      <span className="text-xs text-slate-500">
                        {t.sourceLanguage.toUpperCase()} • {t._count.segments} frases
                      </span>
                    </div>
                  </div>
                  <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Abrir ➔
                  </span>
                </div>
              </Link>
            ))}
            
            {searchResults.length === 0 && (
              <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
                <p className="text-slate-500">Nenhum resultado encontrado para sua busca.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl text-center mt-20">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600 mb-6 py-2 leading-tight">
            Sua Enciclopédia Particular de Transcrições
          </h1>
          <p className="text-xl text-slate-400 mb-10 leading-relaxed">
            Armazene, pesquise e estude o conteúdo dos seus vídeos favoritos do YouTube com transcrições sincronizadas e traduções inteligentes.
          </p>

          <div className="flex gap-4 justify-center">
            <Link 
              href="/import"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
            >
              Começar Importação
            </Link>
            <div className="px-8 py-3 bg-slate-900 border border-slate-800 text-slate-300 font-medium rounded-xl">
              {count} Transcrições salvas
            </div>
          </div>

          {recent.length > 0 && (
            <div className="mt-20 text-left">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">
                Adicionadas Recentemente
              </h2>
              <div className="grid gap-4">
                {recent.map((t) => (
                  <Link 
                    key={t.id} 
                    href={`/transcript/${t.id}`}
                    className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-blue-500/50 transition-colors group"
                  >
                    <span className="text-slate-200 group-hover:text-white transition-colors">{t.title}</span>
                    <span className="text-slate-600 text-xs">➔</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

