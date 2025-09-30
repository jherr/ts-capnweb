import { z } from "zod";
import {
  createCollection,
  localOnlyCollectionOptions,
} from "@tanstack/react-db";

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

// Create TanStack DB collection using localOnlyCollectionOptions
// This properly configures a local-first collection
export const notesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (note: Note) => note.id,
    schema: NoteSchema,
  })
);

console.log("📦 Notes collection created successfully");
