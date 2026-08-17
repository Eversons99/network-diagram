import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/network-diagram/",
  server: {
    host: true,
    allowedHosts: ["commands.nmultifibra.com.br"],
  },
});
