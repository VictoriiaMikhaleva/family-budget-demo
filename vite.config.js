import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/family-budget-demo/" : "/",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
  plugins: [react()],
}));
