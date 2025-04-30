/// <reference types="vitest" />

import { defineConfig } from 'vite'
import baseConfig from '../../vite.config'

// https://vitejs.dev/config/
export default defineConfig({
  ...baseConfig,
  build: {
    ...baseConfig.build,
    lib: {
      name: '@ansible/ui-plugin-pf5',
      entry: 'src/index.ts',
      fileName: 'index',
    },
  },
})
