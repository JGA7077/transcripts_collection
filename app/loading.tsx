export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black/20 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4 bg-slate-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
        <p className="text-sm font-medium text-slate-300 animate-pulse tracking-wide">
          Sincronizando biblioteca...
        </p>
      </div>
    </div>
  );
}

