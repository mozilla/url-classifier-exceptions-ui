import { defineConfig } from 'vite'

export default defineConfig({
  base: '/url-classifier-exceptions-ui/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      }
    }
  }
})