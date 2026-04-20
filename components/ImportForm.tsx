"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importTranscript } from "@/app/actions/import";

export default function ImportForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const formData = new FormData(e.currentTarget);
      const file = (e.currentTarget.elements.namedItem("jsonFile") as HTMLInputElement).files?.[0];
      
      if (!file) throw new Error("Selecione um arquivo JSON");

      const text = await file.text();
      formData.append("jsonContent", text);

      const result = await importTranscript(formData);
      if (result.success && result.id) {
        setMessage("✅ Importado com sucesso! Redirecionando...");
        router.push(`/transcript/${result.id}`);
      }
    } catch (err: any) {
      setMessage(`❌ Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-slate-900 rounded-xl border border-slate-800 space-y-4 max-w-lg">
      <h2 className="text-xl font-bold text-white mb-4">Importar Transcrição</h2>
      
      <div>
        <label className="block text-sm font-medium text-slate-400">Arquivo JSON</label>
        <input 
          type="file" 
          name="jsonFile" 
          accept=".json"
          required
          className="mt-1 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400">Título</label>
        <input 
          type="text" 
          name="title" 
          required
          placeholder="Ex: Como configurar Next.js"
          className="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md text-white px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400">YouTube ID</label>
          <input 
            type="text" 
            name="youtubeId" 
            placeholder="jTnzG46inKc"
            className="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md text-white px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400">Idioma Original</label>
          <select name="sourceLanguage" className="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md text-white px-3 py-2">
            <option value="en">Inglês</option>
            <option value="es">Espanhol</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400">Canal</label>
          <input 
            type="text" 
            name="channelName" 
            className="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md text-white px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400">Categoria</label>
          <input 
            type="text" 
            name="category" 
            className="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md text-white px-3 py-2"
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50"
      >
        {loading ? "Processando..." : "Salvar Transcrição"}
      </button>

      {message && (
        <p className={`text-sm mt-2 ${message.includes("❌") ? "text-red-400" : "text-green-400"}`}>
          {message}
        </p>
      )}
    </form>
  );
}
