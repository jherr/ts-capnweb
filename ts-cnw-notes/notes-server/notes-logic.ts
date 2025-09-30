// Core notes business logic and data structures

export type SyncStatus = "synced" | "pending" | "syncing" | "offline" | "error";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  syncStatus?: SyncStatus;
}

export interface NotesState {
  notes: Map<string, Note>;
}

// Core notes business logic class
export class NotesLogic {
  private state: NotesState = {
    notes: new Map(),
  };

  // Event callbacks for broadcasting changes
  private onNoteCreated?: (note: Note) => Promise<void>;
  private onNoteUpdated?: (note: Note) => Promise<void>;
  private onNoteDeleted?: (noteId: string) => Promise<void>;

  constructor(callbacks?: {
    onNoteCreated?: (note: Note) => Promise<void>;
    onNoteUpdated?: (note: Note) => Promise<void>;
    onNoteDeleted?: (noteId: string) => Promise<void>;
  }) {
    this.onNoteCreated = callbacks?.onNoteCreated;
    this.onNoteUpdated = callbacks?.onNoteUpdated;
    this.onNoteDeleted = callbacks?.onNoteDeleted;
  }

  async createNote(note: Note): Promise<Note> {
    // Ensure we have server timestamp
    const serverNote: Note = {
      ...note,
      updatedAt: Date.now(),
      syncStatus: "synced",
    };

    this.state.notes.set(serverNote.id, serverNote);
    console.log(`📝 Note created: ${serverNote.id}`);

    if (this.onNoteCreated) {
      await this.onNoteCreated(serverNote);
    }

    return serverNote;
  }

  async updateNote(noteId: string, updates: Partial<Note>): Promise<Note> {
    const existingNote = this.state.notes.get(noteId);

    if (!existingNote) {
      throw new Error(`Note ${noteId} not found`);
    }

    const updatedNote: Note = {
      ...existingNote,
      ...updates,
      id: noteId, // Ensure ID doesn't change
      updatedAt: Date.now(), // Server timestamp
      syncStatus: "synced",
    };

    this.state.notes.set(noteId, updatedNote);
    console.log(`✏️  Note updated: ${noteId}`);

    if (this.onNoteUpdated) {
      await this.onNoteUpdated(updatedNote);
    }

    return updatedNote;
  }

  async deleteNote(noteId: string): Promise<void> {
    const note = this.state.notes.get(noteId);

    if (!note) {
      throw new Error(`Note ${noteId} not found`);
    }

    this.state.notes.delete(noteId);
    console.log(`🗑️  Note deleted: ${noteId}`);

    if (this.onNoteDeleted) {
      await this.onNoteDeleted(noteId);
    }
  }

  getNote(noteId: string): Note | undefined {
    return this.state.notes.get(noteId);
  }

  getAllNotes(): Note[] {
    return Array.from(this.state.notes.values());
  }

  // Sync multiple notes (for initial load or conflict resolution)
  async syncNotes(notes: Note[]): Promise<Note[]> {
    const syncedNotes: Note[] = [];

    for (const note of notes) {
      const existingNote = this.state.notes.get(note.id);

      if (!existingNote) {
        // New note from client
        const created = await this.createNote(note);
        syncedNotes.push(created);
      } else {
        // Check which is newer
        if (note.updatedAt > existingNote.updatedAt) {
          // Client version is newer
          const updated = await this.updateNote(note.id, note);
          syncedNotes.push(updated);
        } else {
          // Server version is newer or same
          syncedNotes.push(existingNote);
        }
      }
    }

    return syncedNotes;
  }
}
