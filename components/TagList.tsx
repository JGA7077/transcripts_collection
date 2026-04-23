"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/app/loading";

interface TagListProps {
  uniqueTags: string[];
  selectedTags: string[];
  searchQuery?: string;
}

export default function TagList({ uniqueTags, selectedTags, searchQuery }: TagListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleTagClick = (tag: string) => {
    const isSelected = selectedTags.includes(tag);
    const newTags = isSelected 
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    newTags.forEach(t => params.append("tags", t));

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push("/");
    });
  };

  return (
    <>
      {/* Marcador de carregamento flutuante quando em transição */}
      {isPending && (
        <div className="fixed inset-0 z-[100] transition-opacity">
          <Loading />
        </div>
      )}

      <div className="p-4 border-b border-slate-800">
        <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 flex justify-between items-center">
          Categorias
          {(selectedTags.length > 0 || searchQuery) && (
            <button 
              onClick={handleClear}
              className="text-blue-500 hover:text-blue-400 lowercase tracking-normal font-normal cursor-pointer bg-blue-500/10 px-2 py-0.5 rounded-md transition-colors"
            >
              Limpar Tudo
            </button>
          )}
        </h2>

        <div className="flex flex-wrap gap-2">
          {uniqueTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                disabled={isPending}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                  isSelected 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                } ${isPending ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
