import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'

export default defineConfig({
  server: {
    port: 5174,
  },
  plugins: [
    devServer({
      entry: 'src/index.tsx'
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: 'src/index.tsx',
      output: {
        format: 'es',
        inlineDynamicImports: true
      },
      external: ['cloudflare:workers']
    }
  }
})
