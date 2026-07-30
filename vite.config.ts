import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/route": {
        target: "https://brouter.de",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/route/, "/brouter"),
      },
    },
  },
});
