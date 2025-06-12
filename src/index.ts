/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { URLClassifierExceptionListEntry } from './types';

console.info(
  // TODO: Update this to the actual source code URL
  "%c📂 Source code: %chttps://github.com/",
);

const RS_ENDPOINTS = {
  prod: "https://firefox.settings.services.mozilla.com",
  stage: "https://remote-settings.allizom.org",
  dev: "https://remote-settings-dev.allizom.org",
} as const;

type RSEndpointKey = keyof typeof RS_ENDPOINTS;

/**
 * Get the Remote Settings endpoint to use.
 * Can be overridden by setting VITE_RS_ENVIRONMENT in .env to one of: "prod", "stage", "dev"
 * Defaults to "prod" if not set or invalid
 */
function getRSEndpoint(): string {
  const env = import.meta.env.VITE_RS_ENVIRONMENT as RSEndpointKey;
  return RS_ENDPOINTS[env] || RS_ENDPOINTS.prod;
}

/**
 * Fetch the URL Classifier Exception List Entries from Remote Settings.
 * 
 * @param rsOrigin - The origin of the Remote Settings endpoint.
 * @returns The URL Classifier Exception List Entries.
 */
async function fetchRecords(rsOrigin: string): Promise<URLClassifierExceptionListEntry[]> {
  const response = await fetch(`${rsOrigin}/v1/buckets/main/collections/url-classifier-exceptions/records`);
  if (!response.ok) {
    throw new Error(`Failed to fetch records: ${response.statusText}`);
  }
  const json = await response.json();
  return json.data;
}

const records = await fetchRecords(getRSEndpoint());
console.log(records);

console.debug("bug ids", records[0].bugIds);

document.body.innerText = JSON.stringify(records, null, 2);
