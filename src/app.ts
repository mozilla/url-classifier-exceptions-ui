/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ExceptionListEntry, BugMetaMap } from "./types";
import { getRSEndpoint, RSEnvironment, isRSEnvValid } from "../scripts/rs-config.js";
import "./exceptions-table/exceptions-table";
import "./exceptions-table/top-exceptions-table";
import "./github-corner";

import { versionNumberMatchesFilterExpression } from "./filter-expression/filter-expression.js";

const GITHUB_URL = "https://github.com/mozilla/url-classifier-exceptions-ui";

// Query parameter which can be used to override the RS environment.
const QUERY_PARAM_RS_ENV = "rs_env";
const QUERY_PARAM_RS_USE_PREVIEW = "rs_preview";

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

/**
 * Fetch the records from the Remote Settings environment.
 * @param rsUrl The URL of the Remote Settings environment.
 * @returns The records.
 */
async function fetchRecords(rsUrl: string): Promise<ExceptionListEntry[]> {
  const response = await fetch(getRecordsUrl(rsUrl));
  if (!response.ok) {
    throw new Error(`Failed to fetch records: ${response.statusText}`);
  }
  const json = await response.json();
  return json.data;
}

/**
 * Fetch the metadata for a set of bug IDs from Bugzilla.
 * @param bugIds The set of bug IDs to fetch metadata for.
 * @returns A map of bug IDs to their metadata.
 */
async function fetchBugMetadata(bugIds: Set<string>): Promise<BugMetaMap> {
  if (bugIds.size === 0) {
    return {};
  }

  let url = new URL("https://bugzilla.mozilla.org/rest/bug");
  url.searchParams.set("id", Array.from(bugIds).join(","));
  url.searchParams.set("include_fields", "id,is_open,summary");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch bug metadata: ${response.statusText}`);
  }
  const json = await response.json();

  // Validate the response object.
  if (!json.bugs?.length) {
    throw new Error("Unexpected or outdated format.");
  }

  // Convert API response which is an array of bugs into a map of bug IDs to
  // their metadata.
  let bugMetaMap: BugMetaMap = {};

  for (let bug of json.bugs) {
    bugMetaMap[bug.id] = {
      id: bug.id,
      isOpen: bug.is_open,
      summary: bug.summary,
    };
  }

  // For some bugs Bugzilla may not return data, e.g. because they are sec bugs.
  // In this case we still want to include the bug ID in the map, so it gets listed
  // but with placeholder values.
  for (let bugId of bugIds) {
    if (!bugMetaMap[bugId]) {
      bugMetaMap[bugId] = {
        id: bugId,
        isOpen: false,
        summary: "Unavailable",
      };
    }
  }

  return bugMetaMap;
}

/**
 * Fetch the versions for each Firefox release channel.
 * @returns The versions for each release channel.
 */
async function fetchVersionsPerChannel(): Promise<{
  nightly: string;
  beta: string;
  release: string;
}> {
  let [nightly, beta, release] = await Promise.all([
    fetchVersionNumber("nightly"),
    fetchVersionNumber("beta"),
    fetchVersionNumber("release"),
  ]);
  return {
    nightly,
    beta,
    release,
  };
}

/**
 * Fetch the version number for a given release channel.
 * @param releaseChannel The release channel to fetch the version number for.
 * @returns The version number for the given release channel.
 */
async function fetchVersionNumber(releaseChannel: string): Promise<string> {
  let url = new URL("https://whattrainisitnow.com/api/release/schedule/");
  url.searchParams.set("version", releaseChannel);
  const response = await fetch(url);
  const json = await response.json();
  return json.version;
}

@customElement("app-root")
export class App extends LitElement {
  // The Remote Settings environment to use. The default is configured via env
  // at build time. The user can change this via a dropdown. The user can also
  // override the environment via a query parameter.
  @state()
  rsEnv: RSEnvironment = "prod";

  // Whether to use the preview environment. This bucket includes changes that
  // are still pending review. The user can change this via a checkbox. It can
  // also be overridden via a query parameter.
  @state()
  rsEnvUsePreview: boolean = false;

  // Holds all fetched records.
  @state()
  records: ExceptionListEntry[] = [];

  // Holds all fetched records matching the current Firefox version filter or
  // all records if no filter is selected.
  @state()
  displayRecords: ExceptionListEntry[] = [];

  // Holds the metadata for all bugs that are associated with the exceptions
  // list.
  @state()
  bugMeta: BugMetaMap = {};

  @state()
  loading: boolean = true;

  // Holds error message if fetching records fails.
  @state()
  error: string | null = null;

  // Holds the version numbers for each Firefox release channel.
  @state()
  firefoxVersions: {
    nightly: string;
    beta: string;
    release: string;
  } | null = null;

  @state()
  filterFirefoxChannel: "nightly" | "beta" | "release" | null = null;

  static styles = css`
    /* Sticky headings. */
    h2 {
      margin-top: 2rem;
      position: sticky;
      top: 0;
      background: var(--bg-color);
      margin: 0;
      padding: 1rem 0;
    }

    h3 {
      position: sticky;
      top: 3rem;
      background: var(--bg-color);
      margin: 0;
      padding: 0.5rem 0;
    }

    .error {
      color: red;
    }

    a {
      color: var(--link-color);
    }

    a:hover,
    a:focus {
      color: var(--link-color-hover);
      transition: color 0.2s ease;
    }

    footer {
      margin-top: 2rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    /* Settings section */
    #settings-content {
      padding: 1.5rem 2rem;
      background: var(--bg-secondary, #232323);
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 1rem 1.5rem;
      align-items: center;
      max-width: 480px;
    }
    #settings-content label {
      justify-self: end;
      margin-right: 0.5rem;
      font-weight: 500;
    }
    #settings-content select,
    #settings-content input[type="checkbox"] {
      margin-left: 0.5rem;
      font-size: 1rem;
    }
    #settings-content input[type="checkbox"] {
      transform: scale(1.2);
      margin-right: 0.5rem;
    }
    @media (max-width: 600px) {
      #settings-content {
        grid-template-columns: 1fr;
        padding: 1rem;
        max-width: 100%;
      }
      #settings-content label {
        justify-self: start;
        margin-right: 0;
      }
    }
  `;

  /**
   * Run init once the element is connected to the DOM.
   */
  connectedCallback() {
    super.connectedCallback();

    // Set the initial RS environment and preview setting.
    let { env, usePreview } = getRsEnv();
    this.rsEnv = env;
    this.rsEnvUsePreview = usePreview;

    this.init();
  }

  /**
   * Fetches the records from the Remote Settings environment and sorts them.
   */
  async init() {
    try {
      this.loading = true;

      await this.updateVersionInfo();

      // If we successfully fetched the version info, set the default filter to
      // the latest release channel. We need to do this before calling
      // this.updateRecords so that the initial display is correctly filtered.
      if (this.firefoxVersions) {
        this.filterFirefoxChannel = "release";
      }

      // Fetch the records.
      await this.updateRecords();

      this.error = null;
    } catch (error: any) {
      this.error = error?.message || "Failed to initialize";
    } finally {
      this.loading = false;
    }
  }

  /**
   * Fetch the versions for each Firefox release channel and store it.
   */
  async updateVersionInfo() {
    // Fetch the versions for each release channel.
    try {
      this.firefoxVersions = await fetchVersionsPerChannel();
      console.debug("versions", this.firefoxVersions);
    } catch (error) {
      console.error("Failed to fetch Firefox versions", error);
    }
  }

  /**
   * Fetch the records from the Remote Settings environment and store it.
   */
  async updateRecords() {
    const urlStr = getRSEndpoint(this.rsEnv, this.rsEnvUsePreview).toString();
    this.records = await fetchRecords(urlStr);

    // Spot check if the format is as expected.
    if (this.records.length && this.records[0].bugIds == null) {
      throw new Error("Unexpected or outdated format.");
    }

    // Sort so most recently modified records are at the top.
    this.records.sort((a, b) => b.last_modified - a.last_modified);

    // Update the filtered records based on the selected Firefox version.
    let updateFilteredRecordsPromise = this.updateFilteredRecords();

    // Fetch the metadata for all bugs that are associated with the exceptions list.
    let fetchBugMetadataPromise = fetchBugMetadata(
      new Set(this.records.flatMap((record) => record.bugIds || [])),
    ).then((bugMeta) => {
      this.bugMeta = bugMeta;
    });

    // Wait for both promises to complete.
    await Promise.all([updateFilteredRecordsPromise, fetchBugMetadataPromise]);
  }

  /**
   * Updates the filtered records based on current filter settings.
   * This should be called whenever records filterFirefoxChannel, or
   * firefoxVersions change.
   */
  private async updateFilteredRecords() {
    // If no Firefox version is selected, show all records.
    if (!this.filterFirefoxChannel || !this.firefoxVersions) {
      this.displayRecords = this.records;
      return;
    }

    // Get the records that match the selected Firefox version.
    const targetVersion = this.firefoxVersions[this.filterFirefoxChannel];
    this.displayRecords = await this.getRecordsMatchingFirefoxVersion(targetVersion);
  }

  /**
   * Get the number of unique bugs that are associated with the exceptions list
   * @returns The number of unique bugs.
   */
  get uniqueBugCount(): number {
    return new Set(this.displayRecords.flatMap((record) => record.bugIds || [])).size;
  }

  /**
   * Get the records that match the given Firefox version.
   * Uses the filter_expression field to match records.
   * @param firefoxVersion The Firefox version to match.
   * @returns The records that match the given Firefox version.
   */
  private async getRecordsMatchingFirefoxVersion(
    firefoxVersion: string,
  ): Promise<ExceptionListEntry[]> {
    let filteredRecords = await Promise.all(
      this.records.map(async (record) => {
        let matches = await versionNumberMatchesFilterExpression(
          firefoxVersion,
          record.filter_expression,
        );
        if (matches) {
          return record;
        }
        return null;
      }),
    );
    return filteredRecords.filter((record) => record !== null);
  }

  /**
   * Handle changes to RS environment settings via the UI.
   * @param event The change event either the dropdown or the checkbox.
   */
  private async handleRSEnvChange(event: Event) {
    const target = event.target as HTMLSelectElement | HTMLInputElement;

    if (target.id === "rs-env") {
      this.rsEnv = (target as HTMLSelectElement).value as RSEnvironment;
      // Reset preview setting when environment changes.
      this.rsEnvUsePreview = false;
    } else if (target.id === "rs-env-preview") {
      this.rsEnvUsePreview = (target as HTMLInputElement).checked;
    }

    // Update URL parameters to reflect current settings
    const url = new URL(window.location.href);
    url.searchParams.set(QUERY_PARAM_RS_ENV, this.rsEnv);
    url.searchParams.set(QUERY_PARAM_RS_USE_PREVIEW, this.rsEnvUsePreview.toString());
    window.history.pushState({}, "", url);

    // Fetch the records again with the new settings
    try {
      this.loading = true;

      await this.updateRecords();

      this.error = null;
    } catch (error: any) {
      this.error = error?.message || "Failed to initialize";
    } finally {
      this.loading = false;
    }
  }

  /**
   * Handle changes to the Firefox version filter via the UI.
   * @param event The change event.
   */
  private async handleFirefoxVersionFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;

    this.filterFirefoxChannel = target.value as keyof typeof this.firefoxVersions;

    // Update the filtered records based on the selected Firefox version.
    // This does not require a full re-fetch of the records.
    await this.updateFilteredRecords();
  }

  /**
   * Handle anchor navigation. We need to do this via JS because native navigation
   * does not traverse shadow DOM.
   * @param event The event object.
   */
  private handleAnchorNavigation(event: Event) {
    event.preventDefault();
    if (!(event.target instanceof HTMLAnchorElement)) {
      return;
    }

    let target = event.target as HTMLAnchorElement;

    if (!target.hash.startsWith("#")) {
      return;
    }

    const element = this.shadowRoot?.querySelector(target.hash);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  /**
   * Renders the main content of the app which is dependent on the fetched records.
   * @returns The main content.
   */
  private renderMainContent() {
    if (this.error) {
      return html`<div class="error">Error while processing records: ${this.error}</div>`;
    }

    if (this.loading) {
      return html`<div>Loading...</div>`;
    }

    if (this.displayRecords.length === 0) {
      return html`<div>No records found.</div>`;
    }
    return html`
      <p>
        There are currently a total of ${this.displayRecords.length} exceptions on record.
        ${this.displayRecords.filter((e) => !e.topLevelUrlPattern?.length).length}
        <a href="#global-exceptions" @click=${this.handleAnchorNavigation}>global exceptions</a> and
        ${this.displayRecords.filter((e) => e.topLevelUrlPattern?.length).length}
        <a href="#per-site-exceptions" @click=${this.handleAnchorNavigation}>per-site exceptions</a
        >. ${this.displayRecords.filter((e) => e.category === "baseline").length} of them are
        baseline exceptions and
        ${this.displayRecords.filter((e) => e.category === "convenience").length} convenience
        exceptions.
      </p>
      <p>
        Overall the exceptions resolve ${this.uniqueBugCount} known bugs. Note that global
        exceptions resolve a lot of untracked site breakage, i.e. breakage we don't have a bug for.
      </p>

      <section style="z-index: 10;">
        <h2 id="global-exceptions" style="z-index: 20;">Global Exceptions</h2>
        <p>
          Global exceptions are applied for sub-resources across all top level sites. They are
          applied when blocking a resource breaks many sites.
        </p>

        <h3 style="z-index: 30;">Baseline</h3>
        <exceptions-table
          id="global-baseline"
          .entries=${this.displayRecords}
          .bugMeta=${this.bugMeta}
          .filter=${(entry: ExceptionListEntry) =>
            !entry.topLevelUrlPattern?.length && entry.category === "baseline"}
        ></exceptions-table>

        <h3 style="z-index: 40;">Convenience</h3>
        <exceptions-table
          id="global-convenience"
          .entries=${this.displayRecords}
          .bugMeta=${this.bugMeta}
          .filter=${(entry: ExceptionListEntry) =>
            !entry.topLevelUrlPattern?.length && entry.category === "convenience"}
        ></exceptions-table>
      </section>

      <section style="z-index: 50;">
        <h2 id="per-site-exceptions" style="z-index: 60;">Per-Site Exceptions</h2>
        <p>
          Per-site exceptions are applied for sub-resources on a specific top level site. They are
          applied for site specific breakage.
        </p>

        <h3 style="z-index: 70;">Baseline</h3>
        <exceptions-table
          id="per-site-baseline"
          .entries=${this.displayRecords}
          .bugMeta=${this.bugMeta}
          .filter=${(entry: ExceptionListEntry) =>
            !!entry.topLevelUrlPattern?.length && entry.category === "baseline"}
        ></exceptions-table>

        <h3 style="z-index: 80;">Convenience</h3>
        <exceptions-table
          id="per-site-convenience"
          .entries=${this.displayRecords}
          .bugMeta=${this.bugMeta}
          .filter=${(entry: ExceptionListEntry) =>
            !!entry.topLevelUrlPattern?.length && entry.category === "convenience"}
        ></exceptions-table>

        <h3 style="z-index: 90;">Top Resources</h3>
        <p>
          This table shows the top resources that are allow-listed via site-specific exception list
          entries. If a resource is allow-listed under many top level sites, it can be an indicator
          that it should be added to the global exceptions list.
        </p>
        <top-exceptions-table
          .entries=${this.displayRecords}
          .bugMeta=${this.bugMeta}
        ></top-exceptions-table>
      </section>
    `;
  }

  render() {
    return html`
      <div class="container">
        <h1>URL Classifier Exceptions</h1>
        <p>
          This dashboard lists all exceptions for Firefox's (list based) Enhanced Tracking
          Protection (ETP). Exceptions may be applied when websites break due to tracker blocking.
          This ensures Firefox can protect the privacy of users while still keeping websites
          working. See
          <a
            href="https://wiki.mozilla.org/Security/Anti_tracking_policy#Policy_Exceptions"
            target="_blank"
            rel="noopener noreferrer"
            >our anti-tracking policy</a
          >
          for more information.
        </p>
        <details>
          <summary>UI Settings</summary>
          <div id="settings-content">
            <label for="rs-env">Remote Settings Environment:</label>
            <select id="rs-env" @change=${this.handleRSEnvChange}>
              <option value="prod" ?selected=${this.rsEnv === "prod"}>Prod</option>
              <option value="stage" ?selected=${this.rsEnv === "stage"}>Stage</option>
              <option value="dev" ?selected=${this.rsEnv === "dev"}>Dev</option>
            </select>
            <label for="fx-version">Firefox Version:</label>
            <select
              id="fx-version"
              @change=${this.handleFirefoxVersionFilterChange}
              ?disabled=${!this.firefoxVersions}
            >
              <option value="" ?selected=${this.filterFirefoxChannel === null}>All</option>
              <option value="nightly" ?selected=${this.filterFirefoxChannel === "nightly"}
                >Nightly ${this.firefoxVersions?.nightly}</option
              >
              <option value="beta" ?selected=${this.filterFirefoxChannel === "beta"}
                >Beta ${this.firefoxVersions?.beta}</option
              >
              <option value="release" ?selected=${this.filterFirefoxChannel === "release"}
                >Release ${this.firefoxVersions?.release}</option
              >
            </select>
            <label for="rs-env-preview">Include changes pending review:</label>
            <input
              id="rs-env-preview"
              type="checkbox"
              ?checked=${this.rsEnvUsePreview}
              @change=${this.handleRSEnvChange}
            />
          </div>
        </details>

        ${this.renderMainContent()}

        <footer>
          <p>
            Data source:
            ${(() => {
              const recordsUrl = getRecordsUrl(
                getRSEndpoint(this.rsEnv, this.rsEnvUsePreview).toString(),
              );
              return html`<a href="${recordsUrl}">${recordsUrl}</a>`;
            })()}.
          </p>
        </footer>
        <!-- Show a link to the repository in the top right corner -->
        <github-corner repoUrl=${GITHUB_URL}></github-corner>
      </div>
    `;
  }
}
