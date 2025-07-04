import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/test')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1 className="text-2xl font-bold mb-4">AI Background Remover App</h1>
      <p className="mb-2">Backend says: <b>{message || 'Loading...'}</b></p>
    </div>
  )
}

export default App
