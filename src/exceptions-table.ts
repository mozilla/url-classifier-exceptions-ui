import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ExceptionListEntry } from "./types";
import "./badge";
import "./bug-label";
import "./exception-dialog";
import { ExceptionDialog } from "./exception-dialog";

/**
 * A table component for displaying exception list entries.
 */
@customElement("exceptions-table")
export class ExceptionsTable extends LitElement {
  // Holds all records to display. Some records and fields can be hidden via the filter and filterFields properties.
  @property({ type: Array })
  entries: ExceptionListEntry[] = [];

  // An optional function that filters the entries to display.
  @property({ attribute: false })
  filter: (entry: ExceptionListEntry) => boolean = () => true;

  // An optional array of entry fields to display.
  @property({ type: Array })
  filterFields: (keyof ExceptionListEntry)[] = [
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

  /**
   * Determines if a field should be shown based on the filterFields property.
   * @param field The field to check.
   * @returns The CSS class to apply to the field.
   */
  private getVisibilityClass(field: keyof ExceptionListEntry): string {
    return this.filterFields.includes(field) ? "show-col" : "hidden-col";
  }

  /**
   * Capitalizes the first character of a string.
   * @param str The string to capitalize.
   * @returns The capitalized string.
   */
  private capitalizeFirstChar(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Renders a list of ETP badges.
   * @param categories The categories to render.
   * @returns The rendered badges.
   */
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

  /**
   * Show the detail dialog for the selected entry.
   * @param entry The entry to show the detail for.
   */
  private onDetailClick(entry: ExceptionListEntry) {
    const dialog = this.renderRoot.querySelector("exception-dialog") as ExceptionDialog;
    if (dialog) {
      dialog.entry = entry;
      dialog.show();
    }
  }

  render() {
    return html`
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="${this.getVisibilityClass("id")}">ID</th>
              <th class="${this.getVisibilityClass("bugIds")}">Bugs</th>
              <th class="${this.getVisibilityClass("category")}">Category</th>
              <th class="${this.getVisibilityClass("topLevelUrlPattern")}">Top Site</th>
              <th class="${this.getVisibilityClass("urlPattern")}">Tracker</th>
              <th class="${this.getVisibilityClass("classifierFeatures")}">Classifier Features</th>
              <th class="${this.getVisibilityClass("isPrivateBrowsingOnly")}">Session Type</th>
              <th class="${this.getVisibilityClass("filterContentBlockingCategories")}"
                >ETP Levels</th
              >
              <th class="${this.getVisibilityClass("filter_expression")}">Filter Expression</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            ${this.entries.filter(this.filter).map(
              (entry) => html`
                <tr>
                  <td class="${this.getVisibilityClass("id")}">${entry.id ?? ""}</td>
                  <td class="${this.getVisibilityClass("bugIds")}">
                    <span class="badges">
                      ${Array.isArray(entry.bugIds)
                        ? entry.bugIds.map((bugId) => html`<bug-label bugId=${bugId}></bug-label>`)
                        : ""}
                    </span>
                  </td>
                  <td class="${this.getVisibilityClass("category")}">
                    ${entry.category
                      ? html`<ui-badge type="category" value="${entry.category}"
                          >${this.capitalizeFirstChar(entry.category)}</ui-badge
                        >`
                      : ""}
                  </td>
                  <td class="${this.getVisibilityClass("topLevelUrlPattern")}">
                    ${entry.topLevelUrlPattern ?? ""}
                  </td>
                  <td class="${this.getVisibilityClass("urlPattern")}"
                    >${entry.urlPattern ?? ""}</td
                  >
                  <td class="${this.getVisibilityClass("classifierFeatures")}">
                    <span class="badges">
                      ${Array.isArray(entry.classifierFeatures)
                        ? entry.classifierFeatures.map(
                            (f) => html`<ui-badge type="feature">${f}</ui-badge>`,
                          )
                        : ""}
                    </span>
                  </td>
                  <td class="${this.getVisibilityClass("isPrivateBrowsingOnly")}">
                    ${entry.isPrivateBrowsingOnly === true
                      ? html`<ui-badge type="private">Private</ui-badge>`
                      : html`<ui-badge type="all">All Sessions</ui-badge>`}
                  </td>
                  <td class="${this.getVisibilityClass("filterContentBlockingCategories")}">
                    ${this.renderETPBadges(entry.filterContentBlockingCategories)}
                  </td>
                  <td class="${this.getVisibilityClass("filter_expression")}"
                    >${entry.filter_expression ?? ""}</td
                  >
                  <td>
                    <button @click=${() => this.onDetailClick(entry)}>{ }</button>
                  </td>
                </tr>
              `,
            )}
          </tbody>
        </table>
      </div>
      <!-- Detail view for the selected entry -->
      <exception-dialog></exception-dialog>
    `;
  }
}
