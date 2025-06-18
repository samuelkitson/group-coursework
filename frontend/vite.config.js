import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import jsconfigPaths from "vite-jsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jsconfigPaths()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: {
      protocol: "ws",
      host: "localhost",
      clientPort: 80,
    },
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
});
