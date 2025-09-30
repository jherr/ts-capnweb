import { z } from "zod";

// Define sync status enum
export const SyncStatusSchema = z.enum([
  "synced",
  "pending",
  "syncing",
  "offline",
  "error",
]);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

// Define note schema matching server-side
export const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  syncStatus: SyncStatusSchema.optional(),
});

export type Note = z.infer<typeof NoteSchema>;

// Simple in-memory store for notes with reactive updates
class NotesStore {
  private notes = new Map<string, Note>();
  private listeners = new Set<() => void>();
  private cachedSnapshot: Note[] | null = null;

  insert(note: Note) {
    this.notes.set(note.id, note);
    this.cachedSnapshot = null;
    this.notify();
  }

  update(id: string, updates: Partial<Note>) {
    const existing = this.notes.get(id);
    if (existing) {
      this.notes.set(id, { ...existing, ...updates });
      this.cachedSnapshot = null;
      this.notify();
    }
  }

  delete(id: string) {
    const deleted = this.notes.delete(id);
    if (deleted) {
      this.cachedSnapshot = null;
      this.notify();
    }
  }

  get(id: string): Note | undefined {
    return this.notes.get(id);
  }

  getAll(): Note[] {
    return Array.from(this.notes.values());
  }

  // Get snapshot for useSyncExternalStore - returns stable reference
  getSnapshot(): Note[] {
    if (this.cachedSnapshot === null) {
      this.cachedSnapshot = Array.from(this.notes.values()).sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
    }
    return this.cachedSnapshot;
  }

  clear() {
    this.notes.clear();
    this.cachedSnapshot = null;
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }
}

export const notesStore = new NotesStore();
