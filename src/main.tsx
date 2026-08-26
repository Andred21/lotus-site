import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'

const root = document.getElementById('root')
if (!root) throw new Error('elemento #root ausente em index.html')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
