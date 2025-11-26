import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        // En Docker, usar el nombre del servicio 'backend'
        // En desarrollo local, usar 'localhost'
        target: process.env.VITE_API_TARGET || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        // Proxy para WebSocket
        target: process.env.VITE_API_TARGET || 'http://localhost:8000',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        // Proxy para archivos multimedia (imágenes, etc.)
        target: process.env.VITE_API_TARGET || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "animejs": path.resolve(__dirname, "./node_modules/animejs/lib/anime.es.js"),
    },
  },
}));
