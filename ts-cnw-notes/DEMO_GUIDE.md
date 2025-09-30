# 📝 Demo Guide: Cap'n Web Notes

## 🎯 What We Built

A **Tier 1** note-taking app that demonstrates the perfect pairing of TanStack DB and Cap'n Web RPC.

## ✅ Implemented Features

### 1. Create/Edit Notes Locally (TanStack DB)

- Notes are instantly saved to local TanStack DB collection
- No network delay - immediate UI feedback
- Works completely offline

### 2. Full-text Search (TanStack DB Queries)

- Search across all note titles and content
- Reactive results that update as you type
- Demonstrates TanStack DB's query capabilities

### 3. Background Sync (Cap'n Web)

- Automatic WebSocket connection to server
- Notes sync in the background without blocking UI
- Server broadcasts updates to all connected clients

### 4. Offline Indicator

- Visual connection status in sidebar
- Shows: Connected, Connecting, or Offline
- Updates in real-time

### 5. Sync Status Per Note

- Each note shows its sync state:
  - ✓ **Synced** (green) - On server
  - ⟳ **Syncing** (blue) - Currently syncing
  - ⏱ **Pending** (yellow) - Queued for sync
  - 📴 **Offline** (orange) - Local only
  - ⚠ **Error** (red) - Sync failed
- Visible in both list view and editor

## 🏗️ Architecture Highlights

### TanStack DB Usage

```typescript
// Create collection
export const notesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (note) => note.id,
    schema: NoteSchema,
  })
);

// Live query for reactive UI
const { data: notes } = useLiveQuery((q) =>
  q
    .from({ note: notesCollection })
    .select(({ note }) => note)
    .orderBy(({ note }) => note.updatedAt, "desc")
);

// Optimistic updates
notesCollection.insert(note); // Instant!
```

### Cap'n Web Usage

```typescript
// WebSocket RPC connection
const api = newWebSocketRpcSession(wsUrl);

// Background sync
await api.createNote(note);
await api.updateNote(noteId, updates);

// Poll for updates from other clients
const updates = await api.pollUpdates();
```

### The Bridge Pattern

```typescript
// Client creates note
notesCollection.insert(note); // ← Instant local
api.createNote(note); // ← Background sync

// Server broadcasts
NotesServer.broadcastToAll({
  // ← To all clients
  type: "note_created",
  note,
});

// Clients poll and update
const updates = await api.pollUpdates();
updates.forEach((update) => {
  notesCollection.upsert(update.note); // ← Automatic UI update
});
```

## 🚀 Try It Out

### Open the App

Navigate to: http://localhost:3000

### Test These Scenarios

#### 1. Local-First Works

1. Create a note
2. See it appear instantly (no network delay)
3. Edit the title/content
4. Changes appear immediately

#### 2. Full-Text Search

1. Create several notes with different content
2. Use the search bar
3. Results filter in real-time

#### 3. Background Sync

1. Create a note
2. Watch the sync status indicator
3. See it change: pending → syncing → synced

#### 4. Multi-Client Sync

1. Open the app in two browser tabs
2. Create a note in tab 1
3. Within 2 seconds, it appears in tab 2
4. Edit in either tab - syncs both ways

#### 5. Offline Mode

1. Open DevTools → Network → Go offline
2. Create/edit notes (works!)
3. Note status shows "📴 Offline"
4. Go back online
5. Notes automatically sync

## 📊 What Makes This a Good Demo

### Why TanStack DB Shines Here

1. **Local queries are fast** - Search across notes instantly
2. **Reactive updates** - UI automatically updates when data changes
3. **Offline capability** - Notes work without network
4. **Persistence** - Notes survive page refresh

### Why Cap'n Web Shines Here

1. **Real-time sync** - Changes appear on other clients quickly
2. **Efficient RPC** - Typed function calls over WebSocket
3. **Bi-directional** - Server can push updates to clients
4. **Background operation** - Doesn't block local operations

### Why They Work Together

- **Separation of concerns**:
  - TanStack DB = Local state & queries
  - Cap'n Web = Network sync & transport
- **Complementary strengths**:
  - TanStack DB handles complexity of local data
  - Cap'n Web handles complexity of real-time sync
- **Optimal UX**:
  - Instant local feedback
  - Automatic background sync
  - No waiting for network

## 🔍 Code to Explore

### Key Files

1. **`src/db-collections/index.ts`**
   - TanStack DB collection setup
   - Schema definition with Zod

2. **`src/hooks/useNotes.ts`**
   - CRUD operations with optimistic updates
   - Live query for reactive note list
   - Search implementation

3. **`src/hooks/useNotesSync.ts`**
   - WebSocket connection management
   - Background polling for updates
   - Connection state handling

4. **`notes-server/capnweb-rpc.ts`**
   - Cap'n Web RPC server implementation
   - Broadcasting to multiple clients
   - Update queuing

5. **`notes-server/notes-logic.ts`**
   - Business logic (server-side)
   - Note CRUD operations
   - Last-write-wins conflict resolution

## 💡 What You Can Learn

1. **Local-first architecture** - How to build apps that work offline
2. **Optimistic updates** - Instant UI feedback with background sync
3. **Real-time collaboration** - Multi-client synchronization
4. **Reactive queries** - Live UI updates from database changes
5. **WebSocket RPC** - Type-safe network calls over WebSocket

## 🎓 Next Steps (Tier 2/3)

Want to extend this demo? Try adding:

- **Tags** - Add tags to notes, filter by tag
- **Folders** - Organize notes into folders
- **Version history** - Track note changes over time
- **Collaborative editing** - Real-time cursor positions
- **Conflict resolution UI** - Handle sync conflicts gracefully
- **Markdown support** - Rich text formatting

## 📝 Summary

This demo shows how **TanStack DB** and **Cap'n Web** complement each other:

- TanStack DB provides a powerful client-side database
- Cap'n Web provides efficient real-time synchronization
- Together, they enable local-first apps with seamless sync
- The result is fast, offline-capable, and collaborative

**The key insight**: Let each library do what it's best at, and bridge them cleanly.
