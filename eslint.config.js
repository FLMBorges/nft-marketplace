import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'playwright-report', 'test-results', 'lighthouse', 'public/mockServiceWorker.js', 'src/routeTree.gen.ts']),
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
    rules: {
      // `_nome` marca algo descartado de propósito (ex.: tirar campos internos de um objeto).
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
  {
    // Arquivos de rota exportam `Route`, e os componentes do shadcn exportam variantes junto dos componentes.
    files: ['src/routes/**/*.tsx', 'src/components/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Fixtures do Playwright usam um parâmetro chamado `use`, que a regra de hooks do React confunde com um hook.
    files: ['e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
])
