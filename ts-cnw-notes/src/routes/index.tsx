import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNotesSync } from "@/hooks/useNotesSync";
import { useNotes } from "@/hooks/useNotes";
import { SearchBar } from "@/components/SearchBar";
import { SyncStatus } from "@/components/SyncStatus";
import { NotesList } from "@/components/NotesList";
import { NoteEditor } from "@/components/NoteEditor";

export const Route = createFileRoute("/")({
  ssr: false,
  component: NotesApp,
});

function NotesApp() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { isConnected, isConnecting, error, api, connect } = useNotesSync();
  const { notes, createNote, updateNote, deleteNote, searchNotes, syncStats } =
    useNotes(api, isConnected);

  // Auto-connect on mount - memoize dependencies
  useEffect(() => {
    if (!isConnected && !isConnecting && !error) {
      connect();
    }
  }, [isConnected, isConnecting, error, connect]);

  // Filter notes based on search - useMemo to avoid recalculation
  const filteredNotes = useMemo(
    () => (searchTerm ? searchNotes(searchTerm) : notes),
    [searchTerm, searchNotes, notes]
  );

  // Get selected note - useMemo to avoid recalculation
  const selectedNote = useMemo(
    () =>
      selectedNoteId
        ? notes.find((n) => n.id === selectedNoteId) || null
        : null,
    [selectedNoteId, notes]
  );

  const handleCreateNote = useCallback(async () => {
    const result = await createNote("Untitled", "");
    if (result.success && result.note) {
      setSelectedNoteId(result.note.id);
    }
  }, [createNote]);

  const handleSaveNote = useCallback(
    async (title: string, content: string) => {
      if (selectedNoteId) {
        await updateNote(selectedNoteId, { title, content });
      } else {
        const result = await createNote(title, content);
        if (result.success && result.note) {
          setSelectedNoteId(result.note.id);
        }
      }
    },
    [selectedNoteId, updateNote, createNote]
  );

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      await deleteNote(noteId);
      if (selectedNoteId === noteId) {
        setSelectedNoteId(null);
      }
    },
    [deleteNote, selectedNoteId]
  );

  const handleCloseEditor = useCallback(() => {
    setSelectedNoteId(null);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                📝 Cap'n Web Notes
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Local-first notes with real-time sync
              </p>
            </div>
            <button
              onClick={handleCreateNote}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              + New Note
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-800 border-b border-red-600 text-red-200 px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <span>
              <strong>Connection Error:</strong> {error}
            </span>
            <button
              onClick={connect}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Notes List */}
          <div className="lg:col-span-1 space-y-4">
            <SearchBar onSearch={handleSearch} />

            <SyncStatus
              isConnected={isConnected}
              isConnecting={isConnecting}
              syncStats={syncStats}
            />

            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600 max-h-[600px] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">
                {searchTerm
                  ? `Search Results (${filteredNotes.length})`
                  : "All Notes"}
              </h2>
              <NotesList
                notes={filteredNotes}
                selectedNoteId={selectedNoteId}
                onSelectNote={setSelectedNoteId}
                onDeleteNote={handleDeleteNote}
              />
            </div>
          </div>

          {/* Main Area - Note Editor */}
          <div className="lg:col-span-3">
            {selectedNote ? (
              <NoteEditor
                note={selectedNote}
                onSave={handleSaveNote}
                onClose={handleCloseEditor}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-800 rounded-lg border border-gray-600">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-xl mb-2">No note selected</p>
                  <p className="text-sm mb-4">
                    Select a note from the list or create a new one
                  </p>
                  <button
                    onClick={handleCreateNote}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Your First Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-700">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <div className="mb-2">
            🚀 Built with{" "}
            <a
              href="https://github.com/cloudflare/capnweb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Cap'n Web RPC
            </a>{" "}
            &{" "}
            <a
              href="https://tanstack.com/db"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              TanStack DB
            </a>
          </div>
          <div className="text-xs text-gray-500">
            Local-first architecture with background sync • Works offline
          </div>
        </div>
      </footer>
    </div>
  );
}
