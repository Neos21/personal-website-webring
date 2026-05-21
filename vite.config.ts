import cloudflareAdapter from '@hono/vite-dev-server/cloudflare';
import { reactRouter } from '@react-router/dev/vite';
import serverAdapter from 'hono-react-router-adapter/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    reactRouter(),
    serverAdapter({
      adapter: cloudflareAdapter,
      entry: './server/index.ts'
    })
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/entry-[hash].js`,
        chunkFileNames: `assets/chunk-[hash].js`,
        assetFileNames: `assets/asset-[hash].[ext]`
      }
    }
  }
});
