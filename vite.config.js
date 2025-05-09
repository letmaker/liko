import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'liko',
      formats: ['cjs', 'es'],
      fileName: (format) => `liko.${format}.js`,
    },
    sourcemap: true,
    rollupOptions: {
      external: ['@webgpu/types'],
      output: {
        globals: { planck: 'planck' },
        chunkFileNames: 'liko.[name].[format].js',
      },
    },
  },
  plugins: [dts({ rollupTypes: true })],
});
