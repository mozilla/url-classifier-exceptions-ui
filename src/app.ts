import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ExceptionListEntry } from "./types";
import "./exceptions-table";

const RS_ENDPOINTS = {
  prod: "https://firefox.settings.services.mozilla.com",
  stage: "https://remote-settings.allizom.org",
  dev: "https://remote-settings-dev.allizom.org",
} as const;

type RSEndpointKey = keyof typeof RS_ENDPOINTS;

async function fetchRecords(rsOrigin: string): Promise<ExceptionListEntry[]> {
  const response = await fetch(
    `${rsOrigin}/v1/buckets/main/collections/url-classifier-exceptions/records`,
  );
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

  @state()
  records: ExceptionListEntry[] = [];

  @state()
  error: string | null = null;

  static styles = css`
    h2 {
      margin-top: 2rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.init();
  }

  async init() {
    try {
      this.records = await fetchRecords(RS_ENDPOINTS[this.rsEnv]);
      // Sort so most recently modified records are at the top.
      this.records.sort((a, b) => b.last_modified - a.last_modified);
      this.error = null;
    } catch (error: any) {
      this.error = error?.message || "Failed to initialize";
    }
  }

  render() {
    return html`
      <div class="container">
        <p>
          There are a total of ${this.records.length} exceptions on record.
          ${this.records.filter((e) => !e.topLevelUrlPattern?.length).length} global exceptions and
          ${this.records.filter((e) => e.topLevelUrlPattern?.length).length} per-site exceptions.
          ${this.records.filter((e) => e.category === "baseline").length} of them are baseline
          exceptions and ${this.records.filter((e) => e.category === "convenience").length}
          convenience exceptions.
        </p>

        <h2>Global Exceptions</h2>

        <h3>Baseline</h3>
        <exceptions-table
          .entries=${this.records}
          .filter=${(entry: ExceptionListEntry) =>
            !entry.topLevelUrlPattern?.length && entry.category === "baseline"}
          .filterFields=${[
            "bugIds",
            "urlPattern",
            "classifierFeatures",
            "isPrivateBrowsingOnly",
            "filterContentBlockingCategories",
          ]}
        ></exceptions-table>

        <h3>Convenience</h3>
        <exceptions-table
          .entries=${this.records}
          .filter=${(entry: ExceptionListEntry) =>
            !entry.topLevelUrlPattern?.length && entry.category === "convenience"}
          .filterFields=${[
            "bugIds",
            "urlPattern",
            "classifierFeatures",
            "isPrivateBrowsingOnly",
            "filterContentBlockingCategories",
          ]}
        ></exceptions-table>

        <h2>Per-Site Exceptions</h2>
        <h3>Baseline</h3>
        <exceptions-table
          .entries=${this.records}
          .filter=${(entry: ExceptionListEntry) =>
            !!entry.topLevelUrlPattern?.length && entry.category === "baseline"}
          .filterFields=${[
            "bugIds",
            "urlPattern",
            "topLevelUrlPattern",
            "classifierFeatures",
            "isPrivateBrowsingOnly",
            "filterContentBlockingCategories",
          ]}
        ></exceptions-table>

        <h3>Convenience</h3>
        <exceptions-table
          .entries=${this.records}
          .filter=${(entry: ExceptionListEntry) =>
            !!entry.topLevelUrlPattern?.length && entry.category === "convenience"}
          .filterFields=${[
            "bugIds",
            "urlPattern",
            "topLevelUrlPattern",
            "classifierFeatures",
            "isPrivateBrowsingOnly",
            "filterContentBlockingCategories",
          ]}
        ></exceptions-table>

        ${this.error ? html`<div class="error">${this.error}</div>` : ""}

        <p>
          <label for="rs-env">Remote Settings Environment:</label>
          <select
            @change=${(e: Event) => {
              this.rsEnv = (e.target as HTMLSelectElement).value as RSEndpointKey;
              this.init();
            }}
          >
            <option value="prod">Prod</option>
            <option value="stage">Stage</option>
            <option value="dev">Dev</option>
          </select>
        </p>
      </div>
    `;
  }
}
