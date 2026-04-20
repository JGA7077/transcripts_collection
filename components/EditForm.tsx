"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTranscript } from "@/app/actions/update";

interface TranscriptData {
  id: string;
  title: string;
  youtubeId: string | null;
  channelName: string | null;
  categories: string[];
  sourceLanguage: string;
}

export default function EditForm({ transcript }: { transcript: TranscriptData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateTranscript(transcript.id, formData);
      
      if (result.success) {
        setMessage("✅ Atualizado com sucesso!");
        router.push(`/transcript/${transcript.id}`);
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(`❌ Erro: ${err.message}`);
      } else {
        setMessage("❌ Erro desconhecido");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 bg-slate-900 rounded-3xl border border-slate-800 space-y-6 max-w-2xl w-full shadow-2xl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-white">Editar Informações</h2>
        <button 
          type="button"
          onClick={() => router.back()}
          className="text-sm text-slate-400 hover:text-white"
        >
          Cancelar
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
          <input 
            type="text" 
            name="title" 
            defaultValue={transcript.title}
            required
            className="w-full bg-slate-800 border-slate-700 rounded-xl text-white px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">YouTube ID</label>
            <input 
              type="text" 
              name="youtubeId" 
              defaultValue={transcript.youtubeId || ""}
              className="w-full bg-slate-800 border-slate-700 rounded-xl text-white px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Idioma Original</label>
            <select 
              name="sourceLanguage" 
              defaultValue={transcript.sourceLanguage}
              className="w-full h-[52px] bg-slate-800 border-slate-700 rounded-xl text-white px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
            >
              <option value="en">Inglês</option>
              <option value="es">Espanhol</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Canal</label>
            <input 
              type="text" 
              name="channelName" 
              defaultValue={transcript.channelName || ""}
              className="w-full bg-slate-800 border-slate-700 rounded-xl text-white px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Categorias (separadas por vírgula)</label>
            <input 
              type="text" 
              name="categories" 
              defaultValue={transcript.categories?.join(", ") || ""}
              placeholder="Ex: Jack White, Interview"
              className="w-full bg-slate-800 border-slate-700 rounded-xl text-white px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Alterações"}
        </button>

        {message && (
          <p className={`text-center text-sm mt-4 p-3 rounded-lg ${message.includes("❌") ? "bg-red-900/20 text-red-400" : "bg-green-900/20 text-green-400"}`}>
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
