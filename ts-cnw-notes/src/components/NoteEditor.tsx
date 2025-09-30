import { useState, useEffect } from "react";
import type { Note } from "@/db-collections";

interface NoteEditorProps {
  note: Note | null;
  onSave: (title: string, content: string) => void;
  onClose: () => void;
}

export function NoteEditor({ note, onSave, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setHasChanges(false);
    } else {
      setTitle("");
      setContent("");
      setHasChanges(false);
    }
  }, [note]);

  // Track changes
  useEffect(() => {
    if (note) {
      setHasChanges(title !== note.title || content !== note.content);
    } else {
      setHasChanges(title.trim().length > 0 || content.trim().length > 0);
    }
  }, [title, content, note]);

  const handleSave = () => {
    if (title.trim() || content.trim()) {
      onSave(title, content);
      setHasChanges(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + S to save
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  const getSyncIcon = () => {
    if (!note) return null;

    switch (note.syncStatus) {
      case "synced":
        return (
          <span className="text-green-400" title="Synced">
            ✓ Synced
          </span>
        );
      case "syncing":
        return (
          <span className="text-blue-400" title="Syncing">
            ⟳ Syncing...
          </span>
        );
      case "pending":
        return (
          <span className="text-yellow-400" title="Pending sync">
            ⏱ Pending
          </span>
        );
      case "offline":
        return (
          <span className="text-orange-400" title="Saved offline">
            📴 Offline
          </span>
        );
      case "error":
        return (
          <span className="text-red-400" title="Sync error">
            ⚠ Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg border border-gray-600">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Note title..."
          className="flex-1 text-xl font-semibold bg-transparent text-white placeholder-gray-500 focus:outline-none"
        />
        <div className="flex items-center space-x-3 ml-4">
          <span className="text-sm">{getSyncIcon()}</span>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start typing your note..."
          className="w-full h-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none"
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-600 flex items-center justify-between text-sm text-gray-400">
        <div>
          {note && (
            <span>
              Last updated: {new Date(note.updatedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>{content.length} characters</span>
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          {hasChanges && (
            <span className="text-yellow-400">• Unsaved changes</span>
          )}
        </div>
      </div>
    </div>
  );
}
