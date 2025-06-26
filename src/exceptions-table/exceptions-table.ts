/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { BugMetaMap, ExceptionListEntry } from "../types";
import "../badge";
import "../bug-label";
import "./exception-dialog";
import { ExceptionDialog } from "./exception-dialog";
import tableStyles from "./table-styles.css.ts";
import { capitalizeFirstChar, renderUrlPattern } from "./utils.ts";

/**
 * A table component for displaying exception list entries.
 */
@customElement("exceptions-table")
export class ExceptionsTable extends LitElement {
  // Holds all records to display. Some records and fields can be hidden via the filter and filterFields properties.
  @property({ type: Array })
  entries: ExceptionListEntry[] = [];

  // Holds all bug metadata to display.
  @property({ type: Object })
  bugMeta: BugMetaMap = {};

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
    ${tableStyles}
  `;

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
          (cat) => html` <ui-badge type="etp">ETP-${capitalizeFirstChar(cat)}</ui-badge> `,
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
          ? html`<ui-badge
              title="${entry.filter_expression}"
              @click=${() => this.onDetailClick(entry)}
              type="filter"
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

  private getBugMetaForEntry(entry: ExceptionListEntry) {
    return entry.bugIds.map((id) => this.bugMeta[id]).filter((meta) => meta != null);
  }

  private renderTable() {
    return html`
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Bugs</th>
              <th class="${this.hasGlobalRules ? "" : "hidden-col"}">Top Site</th>
              <th>Resource</th>
              <th>Classifier Features</th>
              <th>Filters</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredEntries.map(
              (entry) => html`
                <tr id=${entry.id ?? ""}>
                  <td>
                    <bug-label .bugMeta=${this.getBugMetaForEntry(entry)}></bug-label>
                  </td>
                  <td class="${this.hasGlobalRules ? "" : "hidden-col"}">
                    ${renderUrlPattern(entry.topLevelUrlPattern)}
                  </td>
                  <td>${renderUrlPattern(entry.urlPattern)}</td>
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

  render() {
    if (this.filteredEntries.length === 0) {
      return html`<div>No entries found.</div>`;
    }
    return this.renderTable();
  }
}
