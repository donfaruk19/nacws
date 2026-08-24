import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/nacws/', // ⬅️ Ensures images and scripts load correctly on GitHub Pages
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true
      },
      mangle: true // Scrambles variable and function names into nonsense strings
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        verify: resolve(__dirname, 'verify.html'),
        admin: resolve(__dirname, 'admin.html') // ⬅️ Ensures these secondary pages don't get deleted
      }
    }
  }
});
