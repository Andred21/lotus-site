import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { preloadCritical } from './scripts/vite/preload-critical.mjs'
import { reescreverValidar } from './scripts/vite/reescrever-validar.mjs'
import { CABECALHOS } from './scripts/infra/lib/cabecalhos.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadCritical(), reescreverValidar()],
  // Duas páginas, um HTML cada (ADR-SITE-007). `mpa` desliga o fallback para
  // index.html: dev e preview respondem 404 a caminho desconhecido, como a
  // borda (D11). `/validar*` chega à página pelo plugin `reescreverValidar`.
  appType: 'mpa',
  build: {
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        validar: fileURLToPath(
          new URL('./validar/index.html', import.meta.url),
        ),
      },
    },
  },
  // A mesma política que a borda aplica (scripts/infra/lib/cabecalhos.mjs),
  // servida pelo preview para o E2E do projeto `producao` provar a CSP. O
  // dev fica de fora de propósito: o Vite injeta script inline (preâmbulo do
  // React Refresh) e abre websocket de HMR, que a CSP bloquearia (spec D11).
  preview: {
    headers: { ...CABECALHOS },
  },
})
