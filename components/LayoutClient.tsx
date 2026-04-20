"use client";

import { useState } from "react";

interface LayoutClientProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function LayoutClient({ sidebar, children }: LayoutClientProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-black outline-none">
      {/* Sidebar Container */}
      <div 
        className={`relative h-full transition-all duration-500 ease-in-out border-r border-slate-800 flex-shrink-0 ${
          isOpen ? "w-80" : "w-0 -translate-x-full opacity-0"
        }`}
      >
        <div className="w-80 h-full overflow-hidden">
          {sidebar}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`absolute top-6 z-50 p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            isOpen ? "left-4" : "left-6"
          }`}
          title={isOpen ? "Esconder barra lateral" : "Mostrar barra lateral"}
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          )}
        </button>

        <main className={`flex-1 overflow-y-auto bg-slate-950/50 transition-all duration-500 ${
          isOpen ? "pl-0" : "pl-0"
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
}
