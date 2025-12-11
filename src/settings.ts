/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Manages settings stored in URL search params and environment variables.
 */

import { RSEnvironment, isRSEnvValid } from "../scripts/rs-config";
import { FirefoxChannel } from "./types";

// Query parameter which can be used to override the RS environment.
const QUERY_PARAM_RS_ENV = "rs_env";
const QUERY_PARAM_RS_USE_PREVIEW = "rs_preview";
const QUERY_PARAM_FILTER_FIREFOX_CHANNEL = "fx_channel";
const QUERY_PARAM_FILTER_BUG_ID = "bug_id";

export default {
  getRsEnv,
  setRsEnv,
  getFirefoxChannelFilter,
  getBugIdFilter,
  setFilter,
  getRecordsUrl,
};

/**
 * Get the RS environment from URL parameters, falling back to the defaults if
 * not specified.
 * @returns The RS environment key
 */
function getRsEnv(): { env: RSEnvironment; usePreview: boolean } {
  // Check if the environment is specified in the URL.
  const params = new URLSearchParams(window.location.search);
  const env = params.get(QUERY_PARAM_RS_ENV);
  const usePreview = params.get(QUERY_PARAM_RS_USE_PREVIEW) === "true";
  if (isRSEnvValid(env)) {
    return { env: env as RSEnvironment, usePreview };
  }

  // Fall back to build-time environment variable.
  let viteEnv = import.meta.env.VITE_RS_ENVIRONMENT;
  if (isRSEnvValid(viteEnv)) {
    return { env: viteEnv as RSEnvironment, usePreview: false };
  }

  // Otherwise default to prod, non preview.
  return { env: "prod", usePreview: false };
}

/**
 * Set the RS environment and preview flag in the URL search params.
 * @param env The RS environment to set.
 * @param usePreview Whether to use the preview environment.
 */
function setRsEnv(env: RSEnvironment, usePreview: boolean) {
  const url = new URL(window.location.href);
  url.searchParams.set(QUERY_PARAM_RS_ENV, env);
  url.searchParams.set(QUERY_PARAM_RS_USE_PREVIEW, usePreview.toString());
  window.history.pushState({}, "", url);
}

/**
 * Get the Firefox channel filter from the URL search params.
 * @returns The Firefox channel filter.
 */
function getFirefoxChannelFilter(): FirefoxChannel {
  const params = new URLSearchParams(window.location.search);
  let firefoxChannel = params.get(QUERY_PARAM_FILTER_FIREFOX_CHANNEL);
  if (!firefoxChannel || !["nightly", "beta", "release", "esr"].includes(firefoxChannel)) {
    return "release";
  }
  return firefoxChannel as FirefoxChannel;
}

/**
 * Get the Bug id filter from the URL search params.
 * @returns bug_id to filter for or null
 */
function getBugIdFilter(): string | null {
  const params = new URLSearchParams(window.location.search);
  const bugId = params.get(QUERY_PARAM_FILTER_BUG_ID);
  // check for non-digit strings
  if (bugId !== null && !/^\d+$/.test(bugId)) {
    return null;
  }
  return bugId;
}

/**
 * Set the bug id in the URL search params.
 * @param firefoxChannel The Firefox channel filter to set.
 * @param bugId The Bug Id that gets filtered
 */
function setFilter(firefoxChannel: FirefoxChannel | null, bugId: string | null) {
  const url = new URL(window.location.href);
  if (firefoxChannel === null) {
    url.searchParams.delete(QUERY_PARAM_FILTER_FIREFOX_CHANNEL);
  } else {
    url.searchParams.set(QUERY_PARAM_FILTER_FIREFOX_CHANNEL, firefoxChannel);
  }
  if (bugId === null) {
    url.searchParams.delete(QUERY_PARAM_FILTER_BUG_ID);
  } else {
    url.searchParams.set(QUERY_PARAM_FILTER_BUG_ID, bugId);
  }
  window.history.pushState({}, "", url);
}

/**
 * Get the URL for the records endpoint for a given Remote Settings environment.
 * @param rsUrl The URL of the Remote Settings environment.
 * @returns The URL for the records endpoint.
 */
function getRecordsUrl(rsUrl: string): string {
  // Allow ENV to override the URL for testing.
  if (import.meta.env.VITE_RS_RECORDS_URL) {
    return import.meta.env.VITE_RS_RECORDS_URL;
  }
  return rsUrl;
}
