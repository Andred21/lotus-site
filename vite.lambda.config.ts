import { defineConfig } from 'vite'

// Bundle da funcao de contato (spec D8): um unico `index.mjs` com zod
// embutido e `@aws-sdk/*` externo, porque o runtime Node da Lambda ja traz o
// SDK v3. Modo SSR com entrada unica; `format: 'es'` porque o runtime resolve
// `index.handler` em `index.mjs`.
//
// `publicDir: false` porque o build de biblioteca copiaria `public/` inteiro
// para dentro do zip (medido em 2026-09-26: seis arquivos ao lado do
// index.mjs). Sem plugins de proposito: React e Tailwind nao existem aqui.
export default defineConfig({
  publicDir: false,
  resolve: { noExternal: ['zod'] },
  build: {
    ssr: 'lambda/contato/index.ts',
    outDir: 'dist-lambda/contato',
    emptyOutDir: true,
    target: 'node24',
    minify: false,
    sourcemap: false,
    rolldownOptions: {
      external: [/^@aws-sdk\//, /^node:/],
      output: { entryFileNames: 'index.mjs', format: 'es' },
    },
  },
})
