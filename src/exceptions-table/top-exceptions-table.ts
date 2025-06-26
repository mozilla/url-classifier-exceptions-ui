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
import { getHostFromUrlPattern, getBugMetaForEntry } from "./utils.ts";

interface TopResource {
  host: string;
  topLevelSites: Set<string>;
  bugIds: Set<string>;
  entries: Set<ExceptionListEntry>;
}

/**
 * A table component for displaying the top resources allow-listed via
 * site-specific exception list entries.
 */
@customElement("top-exceptions-table")
export class TopExceptionsTable extends LitElement {
  // Holds all records to display. Some records and fields can be hidden via the filter and filterFields properties.
  @property({ type: Array })
  entries: ExceptionListEntry[] = [];

  // Holds all bug metadata to display.
  @property({ type: Object })
  bugMeta: BugMetaMap = {};

  // The minimum number of unique top level hosts that an entry must be
  // associated with to be included in the table.
  @property({ type: Number })
  minTopSiteCount: number = 2;

  static styles = css`
    ${tableStyles}
  `;

  /**
   * Show the detail dialog for the selected entry.
   * @param entry The entry to show the detail for.
   */
  private onDetailClick(entries: ExceptionListEntry[]) {
    const dialog = this.renderRoot.querySelector("exception-dialog") as ExceptionDialog;
    if (dialog) {
      dialog.entries = entries;
      dialog.show();
    }
  }

  private get topResources(): TopResource[] {
    let topResources: Map<string, TopResource> = new Map();

    for (const entry of this.entries) {
      // For top resources we only care about site specific entries.
      if (!entry.topLevelUrlPattern) {
        continue;
      }
      let resourceHost = getHostFromUrlPattern(entry.urlPattern);
      if (!resourceHost) {
        continue;
      }

      let topResource = topResources.get(resourceHost);
      if (!topResource) {
        topResource = {
          host: resourceHost,
          topLevelSites: new Set(),
          bugIds: new Set(),
          entries: new Set(),
        };
        topResources.set(resourceHost, topResource);
      }

      let topLevelSite = getHostFromUrlPattern(entry.topLevelUrlPattern);
      if (topLevelSite) {
        topResource.topLevelSites.add(topLevelSite);
      }
      entry.bugIds.forEach((bugId) => topResource.bugIds.add(bugId));
      topResource.entries.add(entry);
    }

    // Filter out top resources that don't have enough top level sites to meet the threshold.
    // Sort by the number of top level sites in descending order.
    return Array.from(topResources.values())
      .filter((topResource) => topResource.topLevelSites.size >= this.minTopSiteCount)
      .sort((a, b) => b.topLevelSites.size - a.topLevelSites.size);
  }

  private renderTable() {
    return html`
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="compact-col">Bugs</th>
              <th class="compact-col"># Sites</th>
              <th>Resource</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            ${this.topResources.map(
              (topResource) => html`
                <tr>
                  <td>
                    <bug-label
                      .bugMeta=${Array.from(topResource.bugIds)
                        .map((id) => this.bugMeta[id])
                        .filter((meta) => meta != null)}
                    ></bug-label>
                  </td>
                  <td class="compact-col">${topResource.topLevelSites.size}</td>
                  <td>${topResource.host}</td>
                  <td>
                    <button
                      @click=${() => this.onDetailClick(Array.from(topResource.entries.values()))}
                      >{ }</button
                    >
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
    if (this.topResources.length === 0) {
      return html`<div>No entries found.</div>`;
    }
    return this.renderTable();
  }
}
