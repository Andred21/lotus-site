import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { preloadCritical } from './scripts/vite/preload-critical.mjs'
import { CABECALHOS } from './scripts/infra/lib/cabecalhos.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadCritical()],
  // A mesma política que a borda aplica (scripts/infra/lib/cabecalhos.mjs),
  // servida pelo preview para o E2E do projeto `producao` provar a CSP. O
  // dev fica de fora de propósito: o Vite injeta script inline (preâmbulo do
  // React Refresh) e abre websocket de HMR, que a CSP bloquearia (spec D11).
  preview: {
    headers: { ...CABECALHOS },
  },
})
