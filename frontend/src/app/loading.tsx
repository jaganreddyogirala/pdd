export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-[#07090e]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest animate-pulse">
          Loading Spatial Computing Engine...
        </p>
      </div>
    </div>
  );
}
