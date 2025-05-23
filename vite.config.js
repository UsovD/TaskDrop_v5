import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import mkcert from 'vite-plugin-mkcert';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  plugins: [
    // Allows using React dev server along with building a React application with Vite.
    react(),
    // Allows using the compilerOptions.paths property in tsconfig.json.
    tsconfigPaths(),
    // Creates a custom SSL certificate valid for the local machine.
    process.env.HTTPS && mkcert(),
  ],
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  publicDir: './public',
  server: {
    host: true,
    port: 5000,
    strictPort: false,
    hmr: {
      overlay: true
    },
    middlewareMode: false,
    fs: {
      strict: false,
      allow: ['..']
    }
  },
}); 
 
 