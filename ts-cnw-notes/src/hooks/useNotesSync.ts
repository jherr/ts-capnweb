import { useState, useRef, useCallback, useEffect } from "react";
import { newWebSocketRpcSession } from "capnweb";
import { notesStore } from "@/db-collections";
import type { Note } from "@/db-collections";

export interface NotesAPI {
  connect(clientId: string): Promise<any>;
  disconnect(): Promise<any>;
  getAllNotes(): Promise<Note[]>;
  createNote(note: Note): Promise<any>;
  updateNote(noteId: string, updates: Partial<Note>): Promise<any>;
  deleteNote(noteId: string): Promise<any>;
  pollUpdates(): Promise<any[]>;
  syncNotes(notes: Note[]): Promise<any>;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionStatus: string;
  error: string | null;
}

// Generate a simple client ID
function generateClientId(): string {
  return `client-${Math.random().toString(36).substr(2, 9)}`;
}

export function useNotesSync() {
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    connectionStatus: "Disconnected",
    error: null,
  });

  const apiRef = useRef<NotesAPI | null>(null);
  const clientIdRef = useRef<string>(generateClientId());

  // Note: Broadcaster setup is handled server-side
  // Updates are received via pollUpdates()

  const connect = useCallback(async () => {
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
          ? `${protocol}//${window.location.host}/api/notes-sync`
          : "ws://localhost:3000/api/notes-sync";

      console.log("Connecting to notes sync:", wsUrl);

      const api = newWebSocketRpcSession(wsUrl) as any as NotesAPI;
      apiRef.current = api;

      // Connect and get initial notes
      const result = await api.connect(clientIdRef.current);
      console.log("Notes RPC connection established");

      // Sync initial notes to store
      if (result.notes && Array.isArray(result.notes)) {
        console.log(`📥 Received ${result.notes.length} notes from server`);

        // Clear and populate with server notes
        notesStore.clear();
        result.notes.forEach((note: Note) => {
          notesStore.insert({ ...note, syncStatus: "synced" });
        });
      }

      setState({
        isConnected: true,
        isConnecting: false,
        connectionStatus: "Connected",
        error: null,
      });
    } catch (error) {
      console.error("Notes connection failed:", error);
      setState({
        isConnected: false,
        isConnecting: false,
        connectionStatus: "Failed to connect",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (apiRef.current) {
      try {
        await apiRef.current.disconnect();
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
      apiRef.current = null;
    }

    // Clear store
    notesStore.clear();

    setState({
      isConnected: false,
      isConnecting: false,
      connectionStatus: "Disconnected",
      error: null,
    });
  }, []);

  // Poll for updates from server
  const pollUpdates = useCallback(async () => {
    if (!apiRef.current || !state.isConnected) return;

    try {
      const updates = await apiRef.current.pollUpdates();

      if (updates && updates.length > 0) {
        console.log(`📥 Received ${updates.length} updates from server`);

        updates.forEach((update: any) => {
          if (update.type === "note_created") {
            notesStore.insert({ ...update.note, syncStatus: "synced" });
          } else if (update.type === "note_updated") {
            notesStore.update(update.note.id, {
              ...update.note,
              syncStatus: "synced",
            });
          } else if (update.type === "note_deleted") {
            notesStore.delete(update.noteId);
          }
        });
      }
    } catch (error) {
      console.error("Error polling updates:", error);
    }
  }, [state.isConnected]);

  // Set up polling interval
  useEffect(() => {
    if (!state.isConnected) return;

    const interval = setInterval(pollUpdates, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [state.isConnected, pollUpdates]);

  return {
    ...state,
    api: apiRef.current,
    clientId: clientIdRef.current,
    connect,
    disconnect,
  };
}
