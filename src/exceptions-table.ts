/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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

  /**
   * The filtered entries to display.
   * @returns The filtered entries.
   */
  get filteredEntries(): ExceptionListEntry[] {
    return this.entries.filter(this.filter);
  }

  /**
   * Determines if the table has global rules.
   * @returns True if the table has global rules, false otherwise.
   */
  get hasGlobalRules(): boolean {
    return this.filteredEntries.some((entry) => entry.topLevelUrlPattern?.length);
  }

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
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3em;
    }
  `;

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
  private renderETPBadges(entry: ExceptionListEntry) {
    let categories = entry.filterContentBlockingCategories;

    if (!Array.isArray(categories) || categories.length === 0) {
      return html``;
    }
    return html`
      <span class="badges">
        ${categories.map(
          (cat) => html` <ui-badge type="etp">ETP-${this.capitalizeFirstChar(cat)}</ui-badge> `,
        )}
      </span>
    `;
  }

  /**
   * Renders the filters for an entry in a badge list.
   * @param entry The entry to render the filters for.
   * @returns The rendered filters.
   */
  private renderFilters(entry: ExceptionListEntry) {
    const hasETPFilter =
      Array.isArray(entry.filterContentBlockingCategories) &&
      entry.filterContentBlockingCategories.length > 0;
    const hasFilterExpression = !!entry.filter_expression;
    const hasPBMFilter = entry.isPrivateBrowsingOnly != null;

    if (!hasETPFilter && !hasFilterExpression && !hasPBMFilter) {
      return html`<span class="badges">-</span>`;
    }

    return html`
      <span class="badges">
        ${this.renderETPBadges(entry)}
        ${entry.filter_expression
          ? html`<ui-badge @click=${() => this.onDetailClick(entry)} type="filter"
              >RS Filter</ui-badge
            >`
          : ""}
        ${entry.isPrivateBrowsingOnly != null
          ? html`<ui-badge type="private">PBM Only</ui-badge>`
          : ""}
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
              <th>Bugs</th>
              <th>Category</th>
              <th class="${this.hasGlobalRules ? "" : "hidden-col"}">Top Site</th>
              <th>Tracker</th>
              <th>Classifier Features</th>
              <th>Filters</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredEntries.map(
              (entry) => html`
                <tr>
                  <td>
                    <span class="badges">
                      ${Array.isArray(entry.bugIds)
                        ? entry.bugIds.map((bugId) => html`<bug-label bugId=${bugId}></bug-label>`)
                        : ""}
                    </span>
                  </td>
                  <td>
                    ${entry.category
                      ? html`<ui-badge type="category" value="${entry.category}"
                          >${this.capitalizeFirstChar(entry.category)}</ui-badge
                        >`
                      : ""}
                  </td>
                  <td class="${this.hasGlobalRules ? "" : "hidden-col"}">
                    ${entry.topLevelUrlPattern ?? ""}
                  </td>
                  <td>${entry.urlPattern ?? ""}</td>
                  <td>
                    <span class="badges">
                      ${Array.isArray(entry.classifierFeatures)
                        ? entry.classifierFeatures.map(
                            (f) => html`<ui-badge type="feature">${f}</ui-badge>`,
                          )
                        : ""}
                    </span>
                  </td>
                  <td> ${this.renderFilters(entry)} </td>
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
