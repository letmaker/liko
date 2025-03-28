import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "liko",
      formats: ["cjs", "es"],
      fileName: (format) => `liko.${format}.js`,
    },
    sourcemap: true,
    rollupOptions: {
      external: ["@webgpu/types", "planck"],
      output: {
        globals: {
          planck: "planck",
        },
      },
    },
  },
});
