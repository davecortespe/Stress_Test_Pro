import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-ignore
import { apiPlugin } from "./vite-api-plugin.mjs";

export default defineConfig({
  plugins: [react(), apiPlugin()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  }
});
