/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Base URLs for different Remote Settings environments
export const RS_BASE_URLS = {
  prod: "https://firefox.settings.services.mozilla.com",
  stage: "https://firefox.settings.services.allizom.org",
  dev: "https://remote-settings-dev.allizom.org",
};

// Collection name
const RS_COLLECTION = "url-classifier-exceptions";

export function isRSEnvValid(env) {
  return env && Object.keys(RS_BASE_URLS).includes(env);
}

/**
 * Build a Remote Settings URL for a given environment and bucket
 * @param {string} baseUrl - The base URL for the Remote Settings environment.
 * @param {string} bucket - The bucket name.
 * @param {string} collection - The collection name.
 * @param {string} suffix - The suffix to add to the URL.
 * @returns {URL} The Remote Settings URL.
 */
function buildRSUrl(baseUrl, bucket, collection, suffix) {
  if (!baseUrl || !bucket || !collection) {
    throw new Error("Invalid parameters");
  }

  let urlStr = `${baseUrl}/v1/buckets/${bucket}/collections/${collection}`;

  if (suffix) {
    urlStr += `/${suffix}`;
  }

  return new URL(urlStr);
}

/**
 * Get the Remote Settings endpoint for records.
 * @param {string} env - The environment to use.
 * @param {boolean} isPreview - Whether to use the preview bucket.
 * @returns {URL} The Remote Settings URL.
 */
export function getRSEndpoint(env, isPreview) {
  return buildRSUrl(
    RS_BASE_URLS[env],
    isPreview ? "main-preview" : "main",
    RS_COLLECTION,
    "records",
  );
}

/**
 * Get the Remote Settings endpoint for collection metadata.
 * @param {string} env - The environment to use.
 * @param {boolean} isPreview - Whether to use the preview bucket.
 * @returns {URL} The Remote Settings URL.
 */
export function getRSEndpointMeta(env, isPreview) {
  return buildRSUrl(RS_BASE_URLS[env], isPreview ? "main-preview" : "main", RS_COLLECTION);
}
