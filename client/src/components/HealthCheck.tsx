import { useState, useEffect } from 'react';

interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
}

export const HealthCheck = () => {
  const [data, setData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 text-left flex flex-col gap-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl transition-all duration-300 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1">
      <h3 className="m-0 text-blue-400">System Health</h3>
      {loading && !data && <p>Checking status...</p>}
      {error && <p className="text-red-500 text-sm m-0">Error: {error}</p>}
      {data && (
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-[0.95rem]">
            <span className="text-slate-500">Status:</span>
            <span className={`font-semibold font-mono ${data.status === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>
              {data.status.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center text-[0.95rem]">
            <span className="text-slate-500">Uptime:</span>
            <span className="font-semibold font-mono">{Math.floor(data.uptime)}s</span>
          </div>
          <div className="flex justify-between items-center text-[0.95rem]">
            <span className="text-slate-500">Last Check:</span>
            <span className="font-semibold font-mono text-slate-400 text-[0.85rem]">
              {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
      <button
        className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg cursor-pointer font-medium transition-all duration-200 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={fetchHealth}
        disabled={loading}
      >
        {loading ? 'Polling...' : 'Check Now'}
      </button>
    </div>
  );
};
