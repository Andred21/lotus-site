import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ValidarApp } from './app/ValidarApp'

const root = document.getElementById('root')
if (!root) throw new Error('elemento #root ausente em validar/index.html')

createRoot(root).render(
  <StrictMode>
    <ValidarApp />
  </StrictMode>,
)
