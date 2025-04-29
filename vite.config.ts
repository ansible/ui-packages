/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react-swc'
import * as path from 'path'
import { defineConfig, UserConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dts()],
  build: {
    rollupOptions: {
      external: [
        '@module-federation/enhanced',
        '@patternfly/react-core',
        '@patternfly/react-icons',
        'react',
        'react-dom',
        'react-router',
      ],
      output: {
        globals: {
          '@module-federation/enhanced': 'ModuleFederationEnhanced',
          '@patternfly/react-core': 'PatternFlyReactCore',
          '@patternfly/react-icons': 'PatternFlyReactIcons',
          'react-dom': 'ReactDom',
          'react-router': 'ReactRouter',
          react: 'React',
        },
      },
    },
  },
  esbuild: { legalComments: 'none' },
  test: {
    environment: 'happy-dom',
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    coverage: { include: ['**/src/**'] },
  },
} as UserConfig)
