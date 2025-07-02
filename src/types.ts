/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { URLClassifierExceptionListEntry } from "./url-classifier-exception-list-types";

// Metadata about a bug from Bugzilla.
export interface BugMeta {
  id: string;
  isOpen: boolean;
  summary: string;
}

// A map of bug IDs to their metadata.
export interface BugMetaMap {
  [bugId: string]: BugMeta;
}

// The RemoteSettings entry has a last_modified timestamp that is not exposed via the schema.
// Create a type that extends the schema-generated type with the last_modified timestamp.
// This will be the main type used throughout the app.
export interface ExceptionListEntry extends URLClassifierExceptionListEntry {
  last_modified: number;
}

// Firefox release channels for version filtering.
export type FirefoxChannel = "nightly" | "beta" | "release";

// Firefox versions for each release channel.
export interface FirefoxVersions {
  nightly: string;
  beta: string;
  release: string;
}
