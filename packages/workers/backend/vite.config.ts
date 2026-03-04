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
    ssr: true,
    lib: {
      entry: 'src/index.tsx',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['argon2']
    }
  }
})
