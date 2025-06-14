/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ExceptionListEntry } from "./types";
import "./exceptions-table";

const RS_ENDPOINTS = {
  prod: "https://firefox.settings.services.mozilla.com",
  stage: "https://firefox.settings.services.allizom.org",
  dev: "https://remote-settings-dev.allizom.org",
} as const;

type RSEndpointKey = keyof typeof RS_ENDPOINTS;

/**
 * Get the URL for the records endpoint for a given Remote Settings environment.
 * @param rsOrigin The origin of the Remote Settings environment.
 * @returns The URL for the records endpoint.
 */
function getRecordsUrl(rsOrigin: string): string {
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

@customElement("app-root")
export class App extends LitElement {
  // The Remote Settings environment to use. The default is configured via env
  // at build time. The user can change this via a dropdown.
  @state()
  rsEnv: RSEndpointKey = (import.meta.env.VITE_RS_ENVIRONMENT as RSEndpointKey) || "prod";

  // Holds all fetched records.
  @state()
  records: ExceptionListEntry[] = [];

  // Holds error message if fetching records fails.
  @state()
  error: string | null = null;

  static styles = css`
    h2 {
      margin-top: 2rem;
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
      this.records = await fetchRecords(RS_ENDPOINTS[this.rsEnv]);

      // Spot check if the format is as expected.
      if (this.records.length && this.records[0].bugIds == null) {
        this.error = "Unexpected or outdated format.";
        return;
      }
      // Sort so most recently modified records are at the top.
      this.records.sort((a, b) => b.last_modified - a.last_modified);
      this.error = null;
    } catch (error: any) {
      this.error = error?.message || "Failed to initialize";
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

    if (this.records.length === 0) {
      return html`<div>No records found.</div>`;
    }
    return html`
      <p>
        There are a total of ${this.records.length} exceptions on record.
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

      <h2>Global Exceptions</h2>

      <h3>Baseline</h3>
      <exceptions-table
        id="global-baseline"
        .entries=${this.records}
        .filter=${(entry: ExceptionListEntry) =>
          !entry.topLevelUrlPattern?.length && entry.category === "baseline"}
      ></exceptions-table>

      <h3>Convenience</h3>
      <exceptions-table
        id="global-convenience"
        .entries=${this.records}
        .filter=${(entry: ExceptionListEntry) =>
          !entry.topLevelUrlPattern?.length && entry.category === "convenience"}
      ></exceptions-table>

      <h2>Per-Site Exceptions</h2>
      <h3>Baseline</h3>
      <exceptions-table
        id="per-site-baseline"
        .entries=${this.records}
        .filter=${(entry: ExceptionListEntry) =>
          !!entry.topLevelUrlPattern?.length && entry.category === "baseline"}
      ></exceptions-table>

      <h3>Convenience</h3>
      <exceptions-table
        id="per-site-convenience"
        .entries=${this.records}
        .filter=${(entry: ExceptionListEntry) =>
          !!entry.topLevelUrlPattern?.length && entry.category === "convenience"}
      ></exceptions-table>
    `;
  }

  render() {
    return html`
      <div class="container">
        ${this.renderMainContent()}

        <footer>
          <p>
            <label for="rs-env">Remote Settings Environment:</label>
            <select
              id="rs-env"
              @change=${(e: Event) => {
                this.rsEnv = (e.target as HTMLSelectElement).value as RSEndpointKey;
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
      </div>
    `;
  }
}
