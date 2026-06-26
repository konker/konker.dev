import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  splitting: false,
  bundle: false,
  dts: false,
  esbuildOptions(options) {
    options.supported = { ...options.supported, 'import-attributes': true };
  },
  // Copy non-TS assets tsup doesn't emit: runtime config, and the drizzle SQL
  // migrations + journal (consumed by dist/database/migrate.js in the k8s Job).
  onSuccess: 'cp -r src/config/* dist/config/ && cp -r src/database/drizzle dist/database/drizzle',
});
