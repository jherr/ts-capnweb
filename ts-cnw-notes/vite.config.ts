import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { websocketRpcPlugin } from "./notes-server/vite-plugin";

const config = defineConfig({
  plugins: [
    TanStackRouterVite(),
    viteReact(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    websocketRpcPlugin(), // Add WebSocket RPC plugin
  ],
});

export default config;
