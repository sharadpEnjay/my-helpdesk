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
      const response = await fetch('http://localhost:3001/api/health');
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
    const interval = setInterval(fetchHealth, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="health-card glass">
      <h3>System Health</h3>
      {loading && !data && <p>Checking status...</p>}
      {error && <p className="error-text">Error: {error}</p>}
      {data && (
        <div className="health-details">
          <div className="health-item">
            <span className="label">Status:</span>
            <span className={`value ${data.status === 'ok' ? 'success' : 'alert'}`}>
              {data.status.toUpperCase()}
            </span>
          </div>
          <div className="health-item">
            <span className="label">Uptime:</span>
            <span className="value">{Math.floor(data.uptime)}s</span>
          </div>
          <div className="health-item">
            <span className="label">Last Check:</span>
            <span className="value timestamp">
              {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
      <button className="secondary-btn" onClick={fetchHealth} disabled={loading}>
        {loading ? 'Polling...' : 'Check Now'}
      </button>
    </div>
  );
};
