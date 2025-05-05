/// <reference types="vitest" />
import { federation } from '@module-federation/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  server: { port: 4173 },
  plugins: [
    react(),
    process.env.NODE_ENV !== 'test' &&
      federation({
        exposes: {
          './ui-plugin': './src/ExamplePlugin',
          './ExamplePage': './src/ExamplePage',
        },
        name: 'ui-plugin', // must be 'ui-plugin' for shared scope
        filename: 'ui-plugin.js',
        shared: [
          'react',
          'react-dom',
          '@patternfly/patternfly',
          '@patternfly/quickstarts',
          '@patternfly/react-charts',
          '@patternfly/react-core',
          '@patternfly/react-icons',
          '@patternfly/react-styles',
          '@patternfly/react-table',
          '@patternfly/react-templates',
          '@patternfly/react-topology',
        ],
      }),
  ],
  build: {
    sourcemap: true,
    target: 'chrome89', // needed for module federation
  },
})
