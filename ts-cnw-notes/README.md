# 📝 Cap'n Web Notes

A local-first note-taking application showcasing the perfect pairing of **TanStack DB** and **Cap'n Web RPC**.

## ✨ Features (Tier 1)

### Core Functionality

- ✅ **Create/Edit notes locally** - Instant local storage with TanStack DB
- ✅ **Full-text search** - Search across all note titles and content
- ✅ **Background sync** - Automatic syncing via Cap'n Web RPC WebSocket
- ✅ **Offline indicator** - Visual connection status
- ✅ **Sync status per note** - See which notes are synced, pending, or offline

### Architecture Highlights

#### TanStack DB (Client-Side)

- **Local-first storage** - Notes are stored locally and available instantly
- **Live queries** - UI automatically updates when data changes
- **Optimistic updates** - Changes appear immediately, sync happens in background
- **Complex queries** - Full-text search with reactive results

#### Cap'n Web RPC (Real-time Sync)

- **WebSocket connection** - Persistent bi-directional communication
- **Background sync** - Automatic synchronization when online
- **Conflict-free** - Last-write-wins with server timestamps
- **Multi-client** - Changes sync across all connected clients

## 🏗️ Architecture

```
User Types
    ↓
TanStack DB (Local Storage)
    ↓ (Optimistic Update - Instant UI)
    ↓
Cap'n Web RPC (Background Sync)
    ↓
Server (Source of Truth)
    ↓
Broadcast to Other Clients
```

### Key Design Patterns

1. **Optimistic Updates**
   - User action → Immediate local update
   - Background sync to server
   - Update sync status indicator

2. **Live Query Collections**

   ```typescript
   const { data: notes } = useLiveQuery((q) =>
     q
       .from({ note: notesCollection })
       .select(({ note }) => note)
       .orderBy(({ note }) => note.updatedAt, "desc")
   );
   ```

3. **Background Broadcaster**
   - Cap'n Web pushes updates
   - Automatically inserted into TanStack DB
   - UI reactively updates

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 💡 How It Works

### 1. Creating a Note

```typescript
// User clicks "New Note"
const note = {
  id: generateId(),
  title: "My Note",
  content: "Hello world",
  syncStatus: "pending",
};

// Immediately saved locally
notesCollection.insert(note); // ← TanStack DB

// Synced in background
await api.createNote(note); // ← Cap'n Web RPC
```

### 2. Searching Notes

```typescript
// TanStack DB handles the query
const { data: results } = useLiveQuery((q) =>
  q
    .from({ note: notesCollection })
    .where(({ note }) => like(note.content, `%${searchTerm}%`))
);
```

### 3. Real-time Sync

```typescript
// Server broadcasts update
api.onNoteUpdated((note) => {
  // Automatically updates local DB
  notesCollection.upsert(note);
  // UI reactively updates
});
```

## 🎯 Why This Pairing Works

### TanStack DB Strengths

- ✅ Local persistence
- ✅ Complex client-side queries
- ✅ Reactive updates
- ✅ Offline capability

### Cap'n Web Strengths

- ✅ Real-time bidirectional sync
- ✅ Efficient RPC over WebSocket
- ✅ Multi-client broadcasting
- ✅ Background synchronization

### Together

- **Best of both worlds**: Local-first with real-time sync
- **Clean separation**: DB for state, RPC for transport
- **Optimal UX**: Instant feedback + automatic sync
- **Scales well**: Works offline, syncs when online

## 📁 Project Structure

```
ts-cnw-notes/
├── notes-server/           # Cap'n Web RPC server
│   ├── notes-logic.ts      # Business logic
│   ├── capnweb-rpc.ts      # RPC implementation
│   └── vite-plugin.ts      # WebSocket setup
├── src/
│   ├── db-collections/     # TanStack DB collections
│   ├── hooks/              # React hooks
│   │   ├── useNotesSync.ts # WebSocket connection
│   │   └── useNotes.ts     # CRUD operations
│   ├── components/         # UI components
│   │   ├── NoteEditor.tsx
│   │   ├── NotesList.tsx
│   │   ├── SearchBar.tsx
│   │   └── SyncStatus.tsx
│   └── routes/             # App routes
└── package.json
```

## 🔧 Configuration

### WebSocket Endpoint

- Development: `ws://localhost:3000/api/notes-sync`
- Production: `wss://your-domain.com/api/notes-sync`

### Sync Settings

- Poll interval: 2 seconds
- Max queue size: 100 updates
- Optimistic update timeout: 5 seconds

## 🎨 UI Features

- **Dark mode by default** - Easy on the eyes
- **Responsive design** - Works on desktop and mobile
- **Keyboard shortcuts** - Cmd/Ctrl + S to save
- **Visual sync indicators** - See sync status at a glance
- **Real-time search** - Results update as you type

## 🚦 Sync Status Indicators

- ✓ **Synced** (green) - Note is saved on server
- ⟳ **Syncing** (blue) - Currently syncing to server
- ⏱ **Pending** (yellow) - Waiting to sync
- 📴 **Offline** (orange) - Saved locally only
- ⚠ **Error** (red) - Sync failed

## 🤝 Contributing

This is a demo project showcasing TanStack DB + Cap'n Web integration patterns.

## 📄 License

MIT

## 🙏 Acknowledgments

- [TanStack DB](https://tanstack.com/db) - Client-side database
- [Cap'n Web](https://github.com/cloudflare/capnweb) - RPC over WebSocket
- [TanStack Router](https://tanstack.com/router) - Type-safe routing
- [Tailwind CSS](https://tailwindcss.com/) - Styling
