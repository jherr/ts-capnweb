// Cap'n Web RPC server implementation for notes
import { RpcTarget } from "capnweb";
import { WebSocket } from "ws";
import { NotesLogic, type Note } from "./notes-logic.js";

// Global shared notes instance
export const globalNotes = new NotesLogic({
  async onNoteCreated(note) {
    await NotesServer.broadcastToAll({
      type: "note_created",
      note,
    });
  },

  async onNoteUpdated(note) {
    await NotesServer.broadcastToAll({
      type: "note_updated",
      note,
    });
  },

  async onNoteDeleted(noteId) {
    await NotesServer.broadcastToAll({
      type: "note_deleted",
      noteId,
    });
  },
});

// Global registry of active RPC server instances
export const activeServers = new Set<NotesServer>();

// Update queue for each client
export const clientUpdateQueues = new Map<string, Array<any>>();

// Global registry of clients
export const clients = new Map<string, Function>();

// Notes Server Implementation (one per connection)
export class NotesServer extends RpcTarget {
  public clientId: string | null = null;
  private webSocket: WebSocket | null = null;

  constructor() {
    super();
    activeServers.add(this);
    console.log(`📡 Registered new notes server. Total: ${activeServers.size}`);
  }

  setWebSocket(ws: WebSocket) {
    this.webSocket = ws;
    ws.on("close", () => {
      if (this.clientId) {
        console.log(`🔌 WebSocket disconnected for client ${this.clientId}`);
      }
      this.dispose();
    });
  }

  // Broadcast updates to all connected clients
  static async broadcastToAll(update: any, excludeClient?: string) {
    console.log(`📬 Broadcasting to all clients: ${update.type}`);

    let successCount = 0;

    for (const clientId of clients.keys()) {
      if (excludeClient && clientId === excludeClient) {
        continue;
      }

      if (!clientUpdateQueues.has(clientId)) {
        clientUpdateQueues.set(clientId, []);
      }

      const queue = clientUpdateQueues.get(clientId)!;
      queue.push(update);

      // Keep queue size manageable (last 100 updates)
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
      }

      successCount++;
    }

    console.log(`📬 Broadcast successful: ${successCount} clients notified`);
    return { successCount };
  }

  dispose() {
    activeServers.delete(this);
    if (this.clientId) {
      clients.delete(this.clientId);
      clientUpdateQueues.delete(this.clientId);
    }
    console.log(`📡 Unregistered notes server. Total: ${activeServers.size}`);
  }

  // Client connects
  async connect(clientId: string) {
    console.log(`${clientId} is connecting`);
    this.clientId = clientId;
    clients.set(clientId, () => {});

    if (!clientUpdateQueues.has(clientId)) {
      clientUpdateQueues.set(clientId, []);
    }

    // Return all notes for initial sync
    const notes = globalNotes.getAllNotes();
    console.log(`📤 Sending ${notes.length} notes to ${clientId}`);

    return {
      message: "Connected successfully",
      notes,
    };
  }

  // Client disconnects
  async disconnect() {
    if (!this.clientId) return;
    console.log(`${this.clientId} is disconnecting`);
    this.clientId = null;
    return { message: "Disconnected successfully" };
  }

  // Get all notes
  async getAllNotes() {
    return globalNotes.getAllNotes();
  }

  // Create a note
  async createNote(note: Note) {
    if (!this.clientId) {
      throw new Error("Client not connected");
    }

    const createdNote = await globalNotes.createNote(note);
    return {
      message: "Note created successfully",
      note: createdNote,
    };
  }

  // Update a note
  async updateNote(noteId: string, updates: Partial<Note>) {
    if (!this.clientId) {
      throw new Error("Client not connected");
    }

    const updatedNote = await globalNotes.updateNote(noteId, updates);
    return {
      message: "Note updated successfully",
      note: updatedNote,
    };
  }

  // Delete a note
  async deleteNote(noteId: string) {
    if (!this.clientId) {
      throw new Error("Client not connected");
    }

    await globalNotes.deleteNote(noteId);
    return {
      message: "Note deleted successfully",
      noteId,
    };
  }

  // Poll for updates (for clients to get pushed updates)
  async pollUpdates() {
    if (!this.clientId) {
      return [];
    }

    const queue = clientUpdateQueues.get(this.clientId) || [];
    const updates = [...queue];
    clientUpdateQueues.set(this.clientId, []);

    if (updates.length > 0) {
      console.log(
        `📨 ${this.clientId} polling: returning ${updates.length} updates`
      );
    }

    return updates;
  }

  // Sync notes (for initial load or conflict resolution)
  async syncNotes(notes: Note[]) {
    if (!this.clientId) {
      throw new Error("Client not connected");
    }

    const syncedNotes = await globalNotes.syncNotes(notes);
    return {
      message: "Notes synced successfully",
      notes: syncedNotes,
    };
  }
}
