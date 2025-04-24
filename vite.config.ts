/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react-swc'
import * as path from 'path'
import { defineConfig, UserConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        'react',
        '@patternfly/react-core',
        '@patternfly/react-icons',
        '@patternfly/patternfly',
        '@patternfly/react-table',
        'monaco-editor',
      ],
      output: {
        globals: {
          react: 'React',
          '@patternfly/react-core': 'PatternflyReactCore',
          '@patternfly/react-icons': 'PatternflyReactIcons',
          '@patternfly/react-table': 'PatternflyReactTable',
          '@patternfly/patternfly': 'Patternfly',
          'monaco-editor': 'MonacoEditor',
        },
      },
    },
  },
  esbuild: { legalComments: 'none' },
  test: {
    environment: 'happy-dom',
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    server: {
      deps: {
        inline: ['@patternfly/react-styles'],
      },
    },
  },
} as UserConfig)
