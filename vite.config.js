import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',

  publicDir: 'public',

  optimizeDeps: {
    exclude: ['three'],
    esbuildOptions: {
      target: 'esnext',
    },
  },

  resolve: {
    alias: [
      {
        find: /^three\/addons\//,
        replacement: 'three/examples/jsm/',
      },
    ],
    dedupe: ['three'],
  },

  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) {
            return 'three';
          }
          return undefined;
        },
      },
    },
  },
});
