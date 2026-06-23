import { useState, useEffect } from 'react'
import { HealthCheck } from './components/HealthCheck'
import './App.css'

function App() {
  const [message, setMessage] = useState('Connecting to server...')
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetch('http://localhost:3001/api/hello')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage('Failed to connect to server: ' + err.message))
  }, [])

  return (
    <div className="container">
      <header className="glass">
        <h1>Fullstack Bun + Express + React</h1>
        <div className="status-badge">
          <span className="dot"></span>
          {message}
        </div>
      </header>

      <main>
        <div className="card glass">
          <h2>Interactive Counter</h2>
          <p className="description">
            Experience the speed of Bun with Hot Module Replacement (HMR).
          </p>
          <div className="counter-container">
            <span className="count">{count}</span>
            <button className="primary-btn" onClick={() => setCount((c) => c + 1)}>
              Increment
            </button>
          </div>
        </div>

        <div className="grid">
          <HealthCheck />
          <div className="grid-item glass">
            <h3>Backend</h3>
            <p>Express server running on Bun with TypeScript.</p>
          </div>
          <div className="grid-item glass">
            <h3>Frontend</h3>
            <p>React + Vite with TypeScript and modern aesthetics.</p>
          </div>
          <div className="grid-item glass">
            <h3>Runtime</h3>
            <p>Bun: The all-in-one JavaScript toolkit.</p>
          </div>
        </div>
      </main>

      <footer>
        <p>Built with ❤️ using Bun, Express, and React</p>
      </footer>
    </div>
  )
}

export default App
