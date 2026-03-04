import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    {
      name: 'ignore-static-assets-error',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (
            req.url?.includes('.well-known/appspecific/com.chrome.devtools.json') ||
            req.url === '/index.html'
          ) {
            res.statusCode = 404;
            res.end();
            return;
          }
          next();
        });
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      strategies: 'generateSW',
      workbox: {
        mode: 'development',
        globPatterns: ['**/*.{js,css,html,ico,svg}'],
        globIgnores: ['**/index.html'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: '/',
      },
      selfDestroying: false,
      manifest: {
        name: 'HRT Tracker',
        short_name: 'HRT Tracker',
        description: 'Track your HRT progress',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    }),
  ],
  build: {
    outDir: "../../../build/client",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            if (id.includes('date-fns') || id.includes('framer-motion') || id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'vendor-utils';
            }
            if (id.includes('echarts') || id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('react-day-picker')) {
              return 'vendor-ui';
            }
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
