import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import path from 'path';

// ----------------------------------------------------------------------

export default defineConfig(({ mode }) => {
  return {
  plugins: [react(), jsconfigPaths()],
  base: '/',
  define: {
    global: 'window',
    // 'process.env.NODE_ENV': mode === 'production' ? JSON.stringify('production') : JSON.stringify('development')
  },
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1')
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1')
      }
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: true,
    port: 3000
  },
  preview: {
    open: true,
    port: 3000
  }
}});