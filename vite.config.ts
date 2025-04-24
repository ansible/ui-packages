/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react-swc'
import * as path from 'path'
import { defineConfig, UserConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['react', 'react-dom', '@module-federation/enhanced'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDom',
          '@module-federation/enhanced': 'ModuleFederationEnhanced',
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
    coverage: {
      exclude: ['**/dist/**'],
    },
  },
} as UserConfig)
