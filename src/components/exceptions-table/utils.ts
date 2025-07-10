/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { html } from "lit";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Extend dayjs with relative time plugin. This is used for the last modified
// column in the exceptions tables.
dayjs.extend(relativeTime);

// Common utilities for the exceptions table elements.

/**
 * Capitalizes the first character of a string.
 * @param str The string to capitalize.
 * @returns The capitalized string.
 */
export function capitalizeFirstChar(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get the host from a URL pattern using regex.
 * @param urlPattern The URL pattern to get the host from.
 * @returns The host from the URL pattern.
 */
export function getHostFromUrlPattern(urlPattern: string): string | null {
  const match = urlPattern.match(/:\/\/(?:\*\.)?([^/*]+)/);

  if (match?.length && match.length >= 2) {
    return match[1];
  }

  console.warn("Failed to parse host from URL pattern", urlPattern);
  return null;
}

/**
 * Renders the URL pattern for an entry.
 * For simplicity we show only the host part.
 * The full pattern is shown on hover.
 * @param urlPattern The URL pattern to render.
 * @returns The rendered URL pattern.
 */
export function renderUrlPattern(urlPattern?: string) {
  if (!urlPattern) {
    return html`-`;
  }
  let host = getHostFromUrlPattern(urlPattern);

  // If we can't parse the host, return the original URL pattern.
  if (host == null) {
    return urlPattern;
  }

  return html`<span title=${urlPattern}>${host}</span>`;
}

/**
 * Renders the last modified date for an entry. Shows a relative time label
 * and the absolute date on hover.
 * @param lastModified The last modified timestamp to render. Epoch time in
 * milliseconds.
 * @returns The rendered last modified date.
 */
export function renderLastModified(lastModified: number) {
  const dateObj = dayjs(lastModified);
  const absoluteDate = dateObj.toDate().toLocaleString();
  return html`<span title="${absoluteDate}">${dateObj.fromNow()}</span>`;
}
