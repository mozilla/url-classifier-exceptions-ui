/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ExceptionListEntry, BugMetaMap } from "./types";
import "./exceptions-table/exceptions-table";
import "./exceptions-table/top-exceptions-table";
import "./github-corner";

const GITHUB_URL = "https://github.com/mozilla/url-classifier-exceptions-ui";

// Query parameter which can be used to override the RS environment.
const QUERY_PARAM_RS_ENV = "rs_env";

// The available Remote Settings endpoints.
const RS_ENDPOINTS = {
  prod: "https://firefox.settings.services.mozilla.com",
  stage: "https://firefox.settings.services.allizom.org",
  dev: "https://remote-settings-dev.allizom.org",
} as const;

type RSEndpointKey = keyof typeof RS_ENDPOINTS;

/**
 * Get the RS environment from URL parameters, falling back to the defaults if
 * not specified.
 * @returns The RS environment key
 */
function getRsEnv(): RSEndpointKey {
  const params = new URLSearchParams(window.location.search);
  const env = params.get(QUERY_PARAM_RS_ENV);
  if (env && Object.keys(RS_ENDPOINTS).includes(env)) {
    return env as RSEndpointKey;
  }
  // Fall back to build env configuration or if env is not set, the default of "prod".
  return (import.meta.env.VITE_RS_ENVIRONMENT as RSEndpointKey) || "prod";
}

/**
 * Get the URL for the records endpoint for a given Remote Settings environment.
 * @param rsOrigin The origin of the Remote Settings environment.
 * @returns The URL for the records endpoint.
 */
function getRecordsUrl(rsOrigin: string): string {
  // Allow ENV to override the URL for testing.
  if (import.meta.env.VITE_RS_RECORDS_URL) {
    return import.meta.env.VITE_RS_RECORDS_URL;
  }
  return `${rsOrigin}/v1/buckets/main/collections/url-classifier-exceptions/records`;
}

/**
 * Fetch the records from the Remote Settings environment.
 * @param rsOrigin The origin of the Remote Settings environment.
 * @returns The records.
 */
async function fetchRecords(rsOrigin: string): Promise<ExceptionListEntry[]> {
  const response = await fetch(getRecordsUrl(rsOrigin));
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

  return bugMetaMap;
}

@customElement("app-root")
export class App extends LitElement {
  // The Remote Settings environment to use. The default is configured via env
  // at build time. The user can change this via a dropdown. The user can also
  // override the environment via a query parameter.
  @state()
  rsEnv: RSEndpointKey = getRsEnv();

  // Holds all fetched records.
  @state()
  records: ExceptionListEntry[] = [];

  // Holds the metadata for all bugs that are associated with the exceptions
  // list.
  @state()
  bugMeta: BugMetaMap = {};

  @state()
  loading: boolean = true;

  // Holds error message if fetching records fails.
  @state()
  error: string | null = null;

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
  `;

  /**
   * Run init once the element is connected to the DOM.
   */
  connectedCallback() {
    super.connectedCallback();
    this.init();
  }

  /**
   * Fetches the records from the Remote Settings environment and sorts them.
   */
  async init() {
    try {
      this.loading = true;
      this.records = await fetchRecords(RS_ENDPOINTS[this.rsEnv]);

      // Spot check if the format is as expected.
      if (this.records.length && this.records[0].bugIds == null) {
        throw new Error("Unexpected or outdated format.");
      }

      // Sort so most recently modified records are at the top.
      this.records.sort((a, b) => b.last_modified - a.last_modified);

      // Fetch the metadata for all bugs that are associated with the exceptions list.
      this.bugMeta = await fetchBugMetadata(
        new Set(this.records.flatMap((record) => record.bugIds || [])),
      );

      this.error = null;
    } catch (error: any) {
      this.error = error?.message || "Failed to initialize";
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get the number of unique bugs that are associated with the exceptions list
   * @returns The number of unique bugs.
   */
  get uniqueBugCount(): number {
    return new Set(this.records.flatMap((record) => record.bugIds || [])).size;
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

    if (this.records.length === 0) {
      return html`<div>No records found.</div>`;
    }
    return html`
      <p>
        There are currently a total of ${this.records.length} exceptions on record.
        ${this.records.filter((e) => !e.topLevelUrlPattern?.length).length} global exceptions and
        ${this.records.filter((e) => e.topLevelUrlPattern?.length).length} per-site exceptions.
        ${this.records.filter((e) => e.category === "baseline").length} of them are baseline
        exceptions and ${this.records.filter((e) => e.category === "convenience").length}
        convenience exceptions.
      </p>
      <p>
        Overall the exceptions resolve ${this.uniqueBugCount} known bugs. Note that global
        exceptions resolve a lot of untracked site breakage, i.e. breakage we don't have a bug for.
      </p>

      <section style="z-index: 10;">
        <h2 style="z-index: 20;">Global Exceptions</h2>
        <p>
          Global exceptions are applied for sub-resources across all top level sites. They are
          applied when blocking a resource breaks many sites.
        </p>

        <h3 style="z-index: 30;">Baseline</h3>
        <exceptions-table
          id="global-baseline"
          .entries=${this.records}
          .bugMeta=${this.bugMeta}
          .filter=${(entry: ExceptionListEntry) =>
            !entry.topLevelUrlPattern?.length && entry.category === "baseline"}
        ></exceptions-table>

        <h3 style="z-index: 40;">Convenience</h3>
        <exceptions-table
          id="global-convenience"
          .entries=${this.records}
          .bugMeta=${this.bugMeta}
          .filter=${(entry: ExceptionListEntry) =>
            !entry.topLevelUrlPattern?.length && entry.category === "convenience"}
        ></exceptions-table>
      </section>

      <section style="z-index: 50;">
        <h2 style="z-index: 60;">Per-Site Exceptions</h2>
        <p>
          Per-site exceptions are applied for sub-resources on a specific top level site. They are
          applied for site specific breakage.
        </p>

        <h3 style="z-index: 70;">Baseline</h3>
        <exceptions-table
          id="per-site-baseline"
          .entries=${this.records}
          .bugMeta=${this.bugMeta}
          .filter=${(entry: ExceptionListEntry) =>
            !!entry.topLevelUrlPattern?.length && entry.category === "baseline"}
        ></exceptions-table>

        <h3 style="z-index: 80;">Convenience</h3>
        <exceptions-table
          id="per-site-convenience"
          .entries=${this.records}
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
          .entries=${this.records}
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

        ${this.renderMainContent()}

        <footer>
          <p>
            <label for="rs-env">Remote Settings Environment:</label>
            <select
              id="rs-env"
              @change=${(e: Event) => {
                const newEnv = (e.target as HTMLSelectElement).value as RSEndpointKey;
                this.rsEnv = newEnv;

                // When the env changes reflect the update in the URL.
                // Update URL parameter without reloading the page
                const url = new URL(window.location.href);
                url.searchParams.set(QUERY_PARAM_RS_ENV, newEnv);
                window.history.pushState({}, "", url);

                // Fetch the records again.
                this.init();
              }}
            >
              <option value="prod" ?selected=${this.rsEnv === "prod"}>Prod</option>
              <option value="stage" ?selected=${this.rsEnv === "stage"}>Stage</option>
              <option value="dev" ?selected=${this.rsEnv === "dev"}>Dev</option>
            </select>
          </p>
          <p>
            Data source:
            <a href="${getRecordsUrl(RS_ENDPOINTS[this.rsEnv])}"
              >${getRecordsUrl(RS_ENDPOINTS[this.rsEnv])}</a
            >.
          </p>
        </footer>
        <!-- Show a link to the repository in the top right corner -->
        <github-corner repoUrl=${GITHUB_URL}></github-corner>
      </div>
    `;
  }
}
