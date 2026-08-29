import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/content/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'react-dom/*'],
              message: 'content é dado institucional; não importa React.',
            },
            {
              group: ['**/components/**', '**/integrations/**'],
              message: 'content não depende de UI nem de integração.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react/*', 'react-dom/*'],
              message:
                'lib é helper puro; hook React vive junto do consumidor.',
            },
            {
              group: ['**/components/**'],
              message: 'lib não importa componente.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/integrations/**'],
              message:
                'integração entra por prop/callback a partir da composição.',
            },
            {
              group: ['zod', 'zod/*'],
              message:
                'componente não importa Zod; a validação vive em src/lib/ e o componente vê só o resultado.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'fetch não vive em componente; use src/integrations/.',
        },
        {
          name: 'XMLHttpRequest',
          message: 'requisição não vive em componente; use src/integrations/.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'MemberExpression[object.name=/^(window|globalThis|self)$/][property.name=/^(fetch|XMLHttpRequest)$/]',
          message: 'requisição não vive em componente; use src/integrations/.',
        },
      ],
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/sections/**', '**/components/sections/**'],
              message: 'ui é primitiva; seção compõe ui, não o contrário.',
            },
            {
              group: ['**/integrations/**'],
              message:
                'integração entra por prop/callback a partir da composição.',
            },
            {
              group: ['zod', 'zod/*'],
              message:
                'componente não importa Zod; a validação vive em src/lib/ e o componente vê só o resultado.',
            },
          ],
        },
      ],
    },
  },
])
