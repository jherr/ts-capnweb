import { useState, useRef, useCallback } from "react";
import { newWebSocketRpcSession } from "capnweb";

export interface AuctionAPI {
  joinAuction(username: string, notificationCallback: Function): Promise<any>;
  placeBid(amount: number): Promise<any>;
  getCurrentAuction(): Promise<any>;
  getAuctionHistory(): Promise<any>;
  pollMessages(): Promise<any[]>;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: string;
  error: string | null;
}

export function useAuctionConnection() {
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    connectionStatus: "Disconnected",
    error: null,
  });

  const apiRef = useRef<AuctionAPI | null>(null);

  const connect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnecting: true,
      connectionStatus: "Connecting...",
      error: null,
    }));

    try {
      const protocol =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? "wss:"
          : "ws:";
      const wsUrl =
        typeof window !== "undefined"
          ? `${protocol}//${window.location.host}/api/websocket`
          : "ws://localhost:3000/api/websocket";

      console.log("Connecting to auction:", wsUrl);

      const api = newWebSocketRpcSession(wsUrl) as any as AuctionAPI;
      apiRef.current = api;

      // Test connection
      api
        .getCurrentAuction()
        .then(() => {
          console.log("Auction RPC connection established");
          setState({
            isConnected: true,
            isConnecting: false,
            connectionStatus: "Connected",
            error: null,
          });
        })
        .catch((error) => {
          console.error("Auction connection failed:", error);
          setState({
            isConnected: false,
            isConnecting: false,
            connectionStatus: "Failed to connect",
            error: error.message,
          });
        });
    } catch (error) {
      console.error("Failed to create auction session:", error);
      setState({
        isConnected: false,
        isConnecting: false,
        connectionStatus: "Failed to connect",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    if (apiRef.current) {
      apiRef.current = null;
    }
    setState({
      isConnected: false,
      isConnecting: false,
      connectionStatus: "Disconnected",
      error: null,
    });
  }, []);

  return {
    ...state,
    api: apiRef.current,
    connect,
    disconnect,
  };
}
