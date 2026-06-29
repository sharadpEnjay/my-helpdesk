import { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { HealthCheck } from "../components/HealthCheck";

interface HomePageProps {
  userName: string;
  role?: string;
}

export function HomePage({ userName, role }: HomePageProps) {
  const [message, setMessage] = useState("Connecting to server...");
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage("Failed to connect to server: " + err.message));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white/87">
      <Navbar userName={userName} role={role} />
      <div className="flex flex-col gap-8 px-8 pb-8 text-center max-w-5xl mx-auto">
        <header className="p-8 flex flex-col items-center gap-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl">
          <h1 className="m-0 text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
            Fullstack Bun + Express + React
          </h1>
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-500 text-sm font-semibold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-[pulse-dot_2s_infinite]"></span>
            {message}
          </div>
        </header>

        <main className="flex flex-col gap-8">
          <div className="p-12 text-left max-w-3xl mx-auto bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl transition-all duration-300 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1">
            <h2 className="mt-0 text-xl text-white mb-2">Interactive Counter</h2>
            <p className="text-slate-400 text-lg mb-8">
              Experience the speed of Bun with Hot Module Replacement (HMR).
            </p>
            <div className="flex items-center gap-8">
              <span className="text-6xl font-extrabold font-mono">{count}</span>
              <button
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none py-4 px-10 rounded-xl text-lg font-semibold cursor-pointer shadow-lg shadow-blue-600/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-600/40"
                onClick={() => setCount((c) => c + 1)}
              >
                Increment
              </button>
            </div>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            <HealthCheck />
            <div className="p-8 text-left bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl transition-all duration-300 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1">
              <h3 className="mt-0 text-blue-400">Backend</h3>
              <p className="text-slate-400 mb-0">Express server running on Bun with TypeScript.</p>
            </div>
            <div className="p-8 text-left bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl transition-all duration-300 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1">
              <h3 className="mt-0 text-blue-400">Frontend</h3>
              <p className="text-slate-400 mb-0">React + Vite with TypeScript and modern aesthetics.</p>
            </div>
            <div className="p-8 text-left bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl transition-all duration-300 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1">
              <h3 className="mt-0 text-blue-400">Runtime</h3>
              <p className="text-slate-400 mb-0">Bun: The all-in-one JavaScript toolkit.</p>
            </div>
          </div>
        </main>

        <footer className="mt-8 text-slate-500 text-sm">
          <p>Built with Bun, Express, and React</p>
        </footer>
      </div>
    </div>
  );
}
