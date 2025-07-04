import { useState, useEffect } from 'react'
import './App.css'
import ImageUpload from './components/ImageUpload';

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/test')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Background Remover</h1>
      <p className="mb-6 text-gray-700">Backend says: <b>{message || 'Loading...'}</b></p>
      <ImageUpload />
    </div>
  )
}

export default App
