/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { html } from "lit";

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
