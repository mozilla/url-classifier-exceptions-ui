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

export default {
  getRsEnv,
  setRsEnv,
  getFirefoxChannelFilter,
  setFirefoxChannelFilter,
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
function getFirefoxChannelFilter(): FirefoxChannel | null {
  const params = new URLSearchParams(window.location.search);
  let firefoxChannel = params.get(QUERY_PARAM_FILTER_FIREFOX_CHANNEL);
  if (firefoxChannel === "") {
    return null;
  }
  if (!firefoxChannel || !["nightly", "beta", "release", "esr"].includes(firefoxChannel)) {
    return "release";
  }
  return firefoxChannel as FirefoxChannel;
}

/**
 * Set the Firefox channel filter in the URL search params.
 * @param filter The Firefox channel filter to set.
 */
function setFirefoxChannelFilter(filter: FirefoxChannel | null) {
  const url = new URL(window.location.href);
  url.searchParams.set(QUERY_PARAM_FILTER_FIREFOX_CHANNEL, filter ?? "");
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
