// Vite WebSocket plugin for handling Cap'n Web RPC connections
import { Plugin } from "vite";
import { WebSocketServer } from "ws";
import { newWebSocketRpcSession } from "capnweb";
import { NotesServer } from "./capnweb-rpc.js";

// Custom WebSocket RPC plugin for Vite
export function websocketRpcPlugin(): Plugin {
  return {
    name: "websocket-rpc-plugin",
    configureServer(server) {
      if (!server.httpServer) return;

      const wss = new WebSocketServer({
        noServer: true,
      });

      server.httpServer.on("upgrade", (request, socket, head) => {
        const pathname = new URL(request.url!, `http://${request.headers.host}`)
          .pathname;

        // Handle websocket path for notes sync
        if (pathname === "/api/notes-sync") {
          wss.handleUpgrade(request, socket, head, (ws) => {
            console.log(
              "WebSocket RPC connection established on /api/notes-sync"
            );

            // Create a new RPC server instance for this connection
            const notesServer = new NotesServer();
            notesServer.setWebSocket(ws);

            // Set up Cap'n Web RPC over this websocket
            newWebSocketRpcSession(ws as any, notesServer);
          });
        }
      });
    },
  };
}
