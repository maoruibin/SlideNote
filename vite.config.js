import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false, // 不复制 public 目录，由构建脚本单独处理图标
    rollupOptions: {
      input: resolve(__dirname, 'src/sidepanel/index.html'),
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  // 开发服务器
  server: {
    port: 3000,
    open: '/src/sidepanel/index.html',
  },
});
