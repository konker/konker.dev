import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/core/index.ts', 'src/solid/index.ts'],
  format: ['esm'],
  target: 'es2023',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: false,
  dts: true,
});
