import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { URLClassifierExceptionListEntry } from "./types";
import "./badge";
import "./bug-label";

@customElement("exceptions-table")
export class ExceptionsTable extends LitElement {
  @property({ type: Array })
  entries: URLClassifierExceptionListEntry[] = [];

  @property({ attribute: false })
  filter: (entry: URLClassifierExceptionListEntry) => boolean = () => true;

  @property({ type: Array })
  filterFields: (keyof URLClassifierExceptionListEntry)[] = [
    "bugIds",
    "category",
    "urlPattern",
    "classifierFeatures",
    "topLevelUrlPattern",
    "isPrivateBrowsingOnly",
    "filterContentBlockingCategories",
  ];

  static styles = css`
    .table-container {
      overflow-x: auto;
      margin: 1rem 0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      background: var(--bg-color, #fff);
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      min-width: 800px;
      background: inherit;
    }
    th,
    td {
      padding: 0.6em 1em;
      text-align: left;
      border-bottom: 1px solid var(--border-color, #eee);
      vertical-align: middle;
      font-size: 0.97em;
    }
    th {
      background: var(--bg-color, #fafbfc);
      color: var(--heading-color, #222);
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    tr:nth-child(even) {
      background: rgba(0, 0, 0, 0.02);
    }
    tr:hover {
      background: rgba(0, 102, 204, 0.07);
      transition: background 0.2s;
    }
    .hidden-col {
      display: none;
    }
    .show-col {
      display: table-cell;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3em;
    }
  `;

  private isShown(field: keyof URLClassifierExceptionListEntry): string {
    return this.filterFields.includes(field) ? "show-col" : "hidden-col";
  }

  private capitalizeFirstChar(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private renderETPBadges(categories?: ("standard" | "strict" | "custom")[]) {
    if (!Array.isArray(categories) || categories.length === 0) {
      return html`<ui-badge type="all">All</ui-badge>`;
    }
    return html`
      <span class="badges">
        ${categories.map(
          (cat) => html`
            <ui-badge type="etp" value="${cat}">${this.capitalizeFirstChar(cat)}</ui-badge>
          `,
        )}
      </span>
    `;
  }

  render() {
    return html`
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="${this.isShown("id")}">ID</th>
              <th class="${this.isShown("bugIds")}">Bugs</th>
              <th class="${this.isShown("category")}">Category</th>
              <th class="${this.isShown("urlPattern")}">Tracker</th>
              <th class="${this.isShown("classifierFeatures")}">Classifier Features</th>
              <th class="${this.isShown("topLevelUrlPattern")}">Top Site</th>
              <th class="${this.isShown("isPrivateBrowsingOnly")}">Session Type</th>
              <th class="${this.isShown("filterContentBlockingCategories")}">ETP Levels</th>
              <th class="${this.isShown("filter_expression")}">Filter Expression</th>
            </tr>
          </thead>
          <tbody>
            ${this.entries.filter(this.filter).map(
              (entry) => html`
                <tr>
                  <td class="${this.isShown("id")}">${entry.id ?? ""}</td>
                  <td class="${this.isShown("bugIds")}">
                    <span class="badges">
                      ${Array.isArray(entry.bugIds)
                        ? entry.bugIds.map((bugId) => html`<bug-label bugId=${bugId}></bug-label>`)
                        : ""}
                    </span>
                  </td>
                  <td class="${this.isShown("category")}">
                    ${entry.category
                      ? html`<ui-badge type="category" value="${entry.category}"
                          >${this.capitalizeFirstChar(entry.category)}</ui-badge
                        >`
                      : ""}
                  </td>
                  <td class="${this.isShown("urlPattern")}">${entry.urlPattern ?? ""}</td>
                  <td class="${this.isShown("classifierFeatures")}">
                    <span class="badges">
                      ${Array.isArray(entry.classifierFeatures)
                        ? entry.classifierFeatures.map(
                            (f) => html`<ui-badge type="feature">${f}</ui-badge>`,
                          )
                        : ""}
                    </span>
                  </td>
                  <td class="${this.isShown("topLevelUrlPattern")}"
                    >${entry.topLevelUrlPattern ?? ""}</td
                  >
                  <td class="${this.isShown("isPrivateBrowsingOnly")}">
                    ${entry.isPrivateBrowsingOnly === true
                      ? html`<ui-badge type="private">Private</ui-badge>`
                      : html`<ui-badge type="all">All Sessions</ui-badge>`}
                  </td>
                  <td class="${this.isShown("filterContentBlockingCategories")}">
                    ${this.renderETPBadges(entry.filterContentBlockingCategories)}
                  </td>
                  <td class="${this.isShown("filter_expression")}"
                    >${entry.filter_expression ?? ""}</td
                  >
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
    `;
  }
}
