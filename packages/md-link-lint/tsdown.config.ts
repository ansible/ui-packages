import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/scan.ts', 'src/cli.ts'],
  root: 'src',
  outDir: 'dist',
  format: ['esm'],
  fixedExtension: false,
  dts: true,
  /** Make the CLI executable by Node while leaving the library output without a shebang. */
  banner: ({ fileName }) => (fileName.endsWith('cli.js') ? '#!/usr/bin/env node' : undefined),
})
