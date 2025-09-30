import { useCallback, useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { notesCollection } from "@/db-collections";
import type { Note, SyncStatus } from "@/db-collections";
import type { NotesAPI } from "./useNotesSync";

// Generate a unique ID for notes
function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useNotes(api: NotesAPI | null, isConnected: boolean) {
  // Use TanStack DB's useLiveQuery for reactive data (matches working example)
  const { data: allNotes = [] } = useLiveQuery((q) =>
    q
      .from({ note: notesCollection })
      .select(({ note }) => ({
        ...note,
      }))
      .orderBy(({ note }) => note.updatedAt, "desc")
  ) as { data: Note[] };

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

      // Optimistically add to TanStack DB collection
      notesCollection.insert(note);
      console.log("📝 Created note locally:", note.id);

      // Sync to server if connected
      if (api && isConnected) {
        try {
          notesCollection.update(note.id, (draft) => {
            draft.syncStatus = "syncing";
          });
          const result = await api.createNote(note);
          notesCollection.update(result.note.id, (draft) => {
            Object.assign(draft, result.note);
            draft.syncStatus = "synced";
          });
          console.log("✅ Note synced to server:", note.id);
          return { success: true, note: result.note };
        } catch (error) {
          console.error("Error syncing note:", error);
          notesCollection.update(note.id, (draft) => {
            draft.syncStatus = "error";
          });
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
      const existingNote = allNotes.find((n) => n.id === noteId);

      if (!existingNote) {
        return { success: false, error: "Note not found" };
      }

      // Optimistically update TanStack DB collection
      notesCollection.update(noteId, (draft) => {
        if (updates.title !== undefined) draft.title = updates.title;
        if (updates.content !== undefined) draft.content = updates.content;
        draft.updatedAt = Date.now();
        draft.syncStatus = (isConnected ? "pending" : "offline") as SyncStatus;
      });
      console.log("✏️  Updated note locally:", noteId);

      // Sync to server if connected
      if (api && isConnected) {
        try {
          notesCollection.update(noteId, (draft) => {
            draft.syncStatus = "syncing";
          });
          const result = await api.updateNote(noteId, updates);
          notesCollection.update(noteId, (draft) => {
            Object.assign(draft, result.note);
            draft.syncStatus = "synced";
          });
          console.log("✅ Note synced to server:", noteId);
          return { success: true, note: result.note };
        } catch (error) {
          console.error("Error syncing note:", error);
          notesCollection.update(noteId, (draft) => {
            draft.syncStatus = "error";
          });
          return {
            success: false,
            error:
              error instanceof Error ? error.message : "Failed to sync note",
          };
        }
      }

      const updatedNote = allNotes.find((n) => n.id === noteId);
      return { success: true, note: updatedNote };
    },
    [api, isConnected, allNotes]
  );

  // Delete a note
  const deleteNote = useCallback(
    async (noteId: string) => {
      // Optimistically delete from TanStack DB collection
      notesCollection.delete(noteId);
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

    allNotes.forEach((note: Note) => {
      const status = note.syncStatus || "synced";
      if (status in stats) {
        stats[status as keyof typeof stats]++;
      }
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
