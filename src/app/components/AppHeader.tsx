export default function AppHeader() {
  return (
    <header className="w-full bg-white shadow-sm px-6 py-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-bold">
        L
      </div>
      <div>
        <h1 className="font-semibold text-lg">Loom AI</h1>
        <p className="text-xs text-gray-500">
          Unified Retail Assistant
        </p>
      </div>
    </header>
  );
}
