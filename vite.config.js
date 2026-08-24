import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/nacws/',
  plugins: [
    {
      name: 'minify-html',
      transformIndexHtml(html) {
        return html
          .replace(/<!--[\s\S]*?-->/g, '') // Removes all HTML comments
          .replace(/>\s+</g, '><')         // Removes spacing between tags
          .replace(/\s+/g, ' ')            // Collapses multi-line spaces into one
          .trim();
      }
    }
  ],
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true
      },
      mangle: true // Scrambles JavaScript variable names
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        verify: resolve(__dirname, 'verify.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  }
});

