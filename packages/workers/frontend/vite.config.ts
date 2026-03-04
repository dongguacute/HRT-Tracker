import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5174",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "../../../build/client",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-utils': ['date-fns', 'framer-motion', 'lucide-react', 'clsx', 'tailwind-merge'],
          'vendor-charts': ['echarts-for-react', 'recharts'],
          'vendor-ui': ['react-day-picker'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
