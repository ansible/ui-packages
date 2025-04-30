/// <reference types="vitest" />

import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import baseConfig from '../../vite.config'
import { dependencies } from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  ...baseConfig,
  // base: './',
  server: { origin: 'http://localhost:4173', port: 4173 },
  plugins: [
    react(),
    process.env.NODE_ENV !== 'test' &&
      federation({
        name: 'remote-app',
        manifest: true,
        exposes: {
          './ExamplePage': './src/ExamplePage',
          './ui-plugin': './src/ExamplePlugin',
        },
        shareScope: 'default',
        shared: {
          react: {
            requiredVersion: dependencies.react,
            singleton: true,
          },
          'react-dom': {
            requiredVersion: dependencies['react-dom'],
            singleton: true,
          },
          '@patternfly/react-core': {
            requiredVersion: dependencies['@patternfly/react-core'],
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
