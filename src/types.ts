import { URLClassifierExceptionListEntry } from "./url-classifier-exception-list-types";

// The RemoteSettings entry has a last_modified timestamp that is not exposed via the schema.
// Create a type that extends the schema-generated type with the last_modified timestamp.
// This will be the main type used throughout the app.
export interface ExceptionListEntry extends URLClassifierExceptionListEntry {
  last_modified: number;
}