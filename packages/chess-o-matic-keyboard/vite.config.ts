import solid from 'vite-plugin-solid';
import { defineConfig } from 'vite';

const ENTRY_POINTS = {
  index: './src/index.ts',
  'core/candidates': './src/core/candidates.ts',
  'core/context': './src/core/context.ts',
  'core/controller': './src/core/controller.ts',
  'core/index': './src/core/index.ts',
  'core/normalizer': './src/core/normalizer.ts',
  'core/state': './src/core/state.ts',
  'core/types': './src/core/types.ts',
  'solid/CandidateBar': './src/solid/CandidateBar.tsx',
  'solid/ChessKeyboard': './src/solid/ChessKeyboard.tsx',
  'solid/createChessKeyboardController': './src/solid/createChessKeyboardController.ts',
  'solid/index': './src/solid/index.ts',
  'solid/KeyGrid': './src/solid/KeyGrid.tsx',
  'solid/SanReadout': './src/solid/SanReadout.tsx',
  'solid/SecondaryPanel': './src/solid/SecondaryPanel.tsx',
  'solid/SettingsPanel': './src/solid/SettingsPanel.tsx',
} as const;

export default defineConfig({
  plugins: [solid()],
  build: {
    emptyOutDir: false,
    minify: false,
    outDir: 'dist',
    sourcemap: true,
    target: 'es2023',
    rollupOptions: {
      external: ['lucide-solid', 'solid-js', 'solid-js/jsx-runtime', 'solid-js/web'],
      input: ENTRY_POINTS,
      preserveEntrySignatures: 'exports-only',
      output: {
        entryFileNames: '[name].js',
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
