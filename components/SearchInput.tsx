"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";

interface SearchInputProps {
  defaultValue?: string;
  selectedTags: string[];
}

export default function SearchInput({ defaultValue = "", selectedTags }: SearchInputProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (value) params.set("search", value);
    selectedTags.forEach(t => params.append("tags", t));

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setValue("");
    const params = new URLSearchParams();
    selectedTags.forEach(t => params.append("tags", t));
    
    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  return (
    <>
      {isPending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <Loading />
        </div>
      )}
      <form onSubmit={handleSubmit} className="relative group">
        <input 
          type="text" 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar por título, canal..."
          className="w-full bg-slate-900 border-slate-800 rounded-lg py-2 pl-3 pr-16 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
          disabled={isPending}
        />
        <div className="absolute right-3 top-2 flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
              title="Limpar pesquisa"
            >
              ✕
            </button>
          )}
          <button 
            type="submit"
            disabled={isPending}
            className={`text-slate-600 group-focus-within:text-blue-500 transition-colors ${
              isPending ? "opacity-30" : "opacity-100"
            }`}
          >
            {isPending ? "⏳" : "🔍"}
          </button>
        </div>
      </form>
    </>
  );
}


