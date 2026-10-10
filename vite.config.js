import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    rolldownOptions: {
      input: {
        main: resolve(root, 'index.html'),
        form: resolve(root, 'form.html'),
        login: resolve(root, 'login.html'),
        checkout: resolve(root, 'checkout.html'),
        blouses: resolve(root, 'blouses.html'),
        dresses: resolve(root, 'dresses.html'),
        scarfs: resolve(root, 'scarfs.html'),
        sets: resolve(root, 'sets.html'),
        skirts: resolve(root, 'skirts.html'),
        coats: resolve(root, 'coats.html'),
        hoodies: resolve(root, 'hoodies.html'),
      },
    },
  },
})
