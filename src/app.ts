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

function getRSEndpoint(): string {
  const env = import.meta.env.VITE_RS_ENVIRONMENT as RSEndpointKey;
  return RS_ENDPOINTS[env] || RS_ENDPOINTS.prod;
}

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
  @state()
  records: ExceptionListEntry[] = [];

  @state()
  error: string | null = null;

  static styles = css`
    .container {
      padding: 1rem;
    }
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
      this.records = await fetchRecords(getRSEndpoint());
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
      </div>
    `;
  }
}
