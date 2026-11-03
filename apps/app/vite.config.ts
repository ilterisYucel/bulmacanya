import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Bulmacanya",
        short_name: "Bulmacanya",
        lang: "tr",
        display: "standalone",
        theme_color: "#4f46e5",
        background_color: "#ffffff",
      },
    }),
  ],
});
