/// <reference types="vitest" />

import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import baseConfig from '../../vite.config'

// https://vitejs.dev/config/
export default defineConfig({
  ...baseConfig,
  base: 'http://localhost:4173',
  server: {
    origin: 'http://localhost:4173',
    port: 4173,
  },
  plugins: [
    react(),
    process.env.NODE_ENV !== 'test' &&
      federation({
        name: 'remote-app',
        manifest: true,
        remotes: {
          esm_remote: {
            type: 'module',
            name: 'esm_remote',
            entry: 'https://[...]/remoteEntry.js',
          },
          var_remote: 'var_remote@https://[...]/remoteEntry.js',
        },
        exposes: {
          './ExamplePage': './src/ExamplePage1',
          './ui-plugin': './src/ExamplePlugin',
        },
        shared: {
          react: {
            singleton: true,
          },
          'react/': {
            singleton: true,
          },
        },
      }),
  ],
  build: {
    ...baseConfig.build,
    target: 'chrome89',
    manifest: false,
  },
  optimizeDeps: {
    exclude: ['__federation__'],
  },
})
