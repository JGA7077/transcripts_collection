"use client";

import { useState } from "react";
import { searchTranscripts, getTranscriptForExport } from "@/app/actions/export";

interface SearchResult {
  id: string;
  title: string;
  youtubeId: string | null;
  channelName: string | null;
  _count: { segments: number };
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setSearched(true);

    try {
      const data = await searchTranscripts(query);
      setResults(data);
      if (data.length === 0) {
        setMessage("Nenhuma transcrição encontrada.");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(`Erro: ${err.message}`);
      } else {
        setMessage("Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(item: SearchResult) {
    setExportingId(item.id);
    setMessage("");

    try {
      const data = await getTranscriptForExport(item.id);

      const filename = data.youtubeId || data.id;

      const metadata = {
        title: data.title,
        youtubeId: data.youtubeId,
        channelName: data.channelName,
        categories: data.categories,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };

      downloadFile(JSON.stringify(metadata, null, 2), `${filename}_metadata.json`);
      downloadFile(JSON.stringify(data.segments, null, 2), `${filename}_transcript.json`);
      downloadFile(JSON.stringify(data.exercises, null, 2), `${filename}_exercises.json`);
      downloadFile(JSON.stringify(data.listeningExercises || [], null, 2), `${filename}_listening.json`);
      downloadFile(JSON.stringify(data.sequenceExercises || [], null, 2), `${filename}_sequence.json`);

      setMessage(`5 arquivos exportados para "${data.title}"`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(`Erro: ${err.message}`);
      } else {
        setMessage("Erro desconhecido");
      }
    } finally {
      setExportingId(null);
    }
  }

  return (
    <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4 w-full max-w-2xl">
      <h2 className="text-xl font-bold text-white">Exportar Transcrições</h2>
      <p className="text-sm text-slate-400">
        Busque por título, YouTube ID ou nome do canal para exportar os dados.
      </p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar transcrição..."
          className="flex-1 bg-slate-800 border-slate-700 rounded-md text-white px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading || query.trim().length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {message && (
        <p
          className={`text-sm ${
            message.includes("Erro") ? "text-red-400" : "text-green-400"
          }`}
        >
          {message}
        </p>
      )}

      {searched && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            {results.length} resultado{results.length !== 1 ? "s" : ""}
          </p>

          {results.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700"
            >
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-slate-200 truncate">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  {item.channelName && (
                    <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded leading-none">
                      {item.channelName}
                    </span>
                  )}
                  {item.youtubeId && (
                    <span className="text-[10px] text-slate-500">
                      {item.youtubeId}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">
                    {item._count.segments} segments
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleExport(item)}
                disabled={exportingId === item.id}
                className="ml-4 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-md transition duration-200 disabled:opacity-50"
              >
                {exportingId === item.id ? "Exportando..." : "Exportar 5 JSONs"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
