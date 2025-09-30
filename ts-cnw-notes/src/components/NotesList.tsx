import type { Note } from "@/db-collections";

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export function NotesList({
  notes,
  selectedNoteId,
  onSelectNote,
  onDeleteNote,
}: NotesListProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getSyncIcon = (syncStatus?: string) => {
    switch (syncStatus) {
      case "synced":
        return (
          <span className="text-green-400" title="Synced">
            ✓
          </span>
        );
      case "syncing":
        return (
          <span className="text-blue-400 animate-spin" title="Syncing">
            ⟳
          </span>
        );
      case "pending":
        return (
          <span className="text-yellow-400" title="Pending sync">
            ⏱
          </span>
        );
      case "offline":
        return (
          <span className="text-orange-400" title="Saved offline">
            📴
          </span>
        );
      case "error":
        return (
          <span className="text-red-400" title="Sync error">
            ⚠
          </span>
        );
      default:
        return null;
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-4">📝</div>
        <p className="text-lg mb-2">No notes yet</p>
        <p className="text-sm">Create your first note to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <div
          key={note.id}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            selectedNoteId === note.id
              ? "bg-blue-900 border-blue-500"
              : "bg-gray-800 border-gray-600 hover:border-gray-500"
          }`}
          onClick={() => onSelectNote(note.id)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-white truncate flex-1 mr-2">
              {note.title || "Untitled"}
            </h3>
            <div className="flex items-center space-x-2">
              {getSyncIcon(note.syncStatus)}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this note?")) {
                    onDeleteNote(note.id);
                  }
                }}
                className="text-gray-400 hover:text-red-400 transition-colors"
                title="Delete note"
              >
                🗑️
              </button>
            </div>
          </div>

          {note.content && (
            <p className="text-sm text-gray-400 mb-2">
              {truncateContent(note.content)}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatDate(note.updatedAt)}</span>
            <span>{note.content.length} chars</span>
          </div>
        </div>
      ))}
    </div>
  );
}
