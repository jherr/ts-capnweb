import { useCallback, useSyncExternalStore, useMemo } from "react";
import { notesStore } from "@/db-collections";
import type { Note, SyncStatus } from "@/db-collections";
import type { NotesAPI } from "./useNotesSync";

// Generate a unique ID for notes
function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useNotes(api: NotesAPI | null, isConnected: boolean) {
  // Get all notes from store with reactive updates
  const allNotes = useSyncExternalStore(
    (listener) => notesStore.subscribe(listener),
    () => notesStore.getSnapshot(),
    () => []
  );

  // Create a new note
  const createNote = useCallback(
    async (title: string, content: string) => {
      const note: Note = {
        id: generateNoteId(),
        title: title.trim() || "Untitled",
        content: content.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: isConnected ? "pending" : "offline",
      };

      // Optimistically add to local store
      notesStore.insert(note);
      console.log("📝 Created note locally:", note.id);

      // Sync to server if connected
      if (api && isConnected) {
        try {
          notesStore.update(note.id, { syncStatus: "syncing" });
          const result = await api.createNote(note);
          notesStore.update(result.note.id, {
            ...result.note,
            syncStatus: "synced",
          });
          console.log("✅ Note synced to server:", note.id);
          return { success: true, note: result.note };
        } catch (error) {
          console.error("Error syncing note:", error);
          notesStore.update(note.id, { syncStatus: "error" });
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to sync note",
          };
        }
      }

      return { success: true, note };
    },
    [api, isConnected]
  );

  // Update a note
  const updateNote = useCallback(
    async (
      noteId: string,
      updates: Partial<Pick<Note, "title" | "content">>
    ) => {
      const existingNote = notesStore.get(noteId);

      if (!existingNote) {
        return { success: false, error: "Note not found" };
      }

      const updatedData = {
        ...updates,
        updatedAt: Date.now(),
        syncStatus: (isConnected ? "pending" : "offline") as SyncStatus,
      };

      // Optimistically update local store
      notesStore.update(noteId, updatedData);
      console.log("✏️  Updated note locally:", noteId);

      // Sync to server if connected
      if (api && isConnected) {
        try {
          notesStore.update(noteId, { syncStatus: "syncing" });
          const result = await api.updateNote(noteId, updates);
          notesStore.update(noteId, { ...result.note, syncStatus: "synced" });
          console.log("✅ Note synced to server:", noteId);
          return { success: true, note: result.note };
        } catch (error) {
          console.error("Error syncing note:", error);
          notesStore.update(noteId, { syncStatus: "error" });
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to sync note",
          };
        }
      }

      const updatedNote = notesStore.get(noteId);
      return { success: true, note: updatedNote };
    },
    [api, isConnected]
  );

  // Delete a note
  const deleteNote = useCallback(
    async (noteId: string) => {
      // Optimistically delete from local store
      notesStore.delete(noteId);
      console.log("🗑️  Deleted note locally:", noteId);

      // Sync to server if connected
      if (api && isConnected) {
        try {
          await api.deleteNote(noteId);
          console.log("✅ Note deletion synced to server:", noteId);
          return { success: true };
        } catch (error) {
          console.error("Error syncing deletion:", error);
          // Note: We don't restore the note on error for UX reasons
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to sync deletion",
          };
        }
      }

      return { success: true };
    },
    [api, isConnected]
  );

  // Search notes by title or content
  const searchNotes = useCallback(
    (searchTerm: string) => {
      if (!searchTerm.trim()) {
        return allNotes;
      }

      const term = searchTerm.toLowerCase();
      return allNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(term) ||
          note.content.toLowerCase().includes(term)
      );
    },
    [allNotes]
  );

  // Get sync status statistics (memoized)
  const syncStats = useMemo(() => {
    const stats = {
      total: allNotes.length,
      synced: 0,
      pending: 0,
      syncing: 0,
      offline: 0,
      error: 0,
    };

    allNotes.forEach((note) => {
      const status = note.syncStatus || "synced";
      stats[status]++;
    });

    return stats;
  }, [allNotes]);

  return {
    notes: allNotes,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
    syncStats,
  };
}
