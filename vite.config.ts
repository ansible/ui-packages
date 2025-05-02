/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react-swc'
import * as path from 'path'
import { defineConfig, UserConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { externalizeDeps } from 'vite-plugin-externalize-deps'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts(),
    externalizeDeps({
      deps: false,
      devDeps: false,
      except: [],
      nodeBuiltins: false,
      optionalDeps: true,
      peerDeps: true,
      useFile: path.join(process.cwd(), 'package.json'),
    }),
  ],
  esbuild: { legalComments: 'none' },
  test: {
    environment: 'happy-dom',
    setupFiles: [path.resolve(__dirname, 'vitest.setup.ts')],
    coverage: { include: ['**/src/**'] },
  },
} as UserConfig)
