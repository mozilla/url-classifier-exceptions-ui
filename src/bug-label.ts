/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import bugzillaIcon from "./assets/bugzilla-icon.svg";

/**
 * A component for displaying a bug label with a bugzilla icon.
 * The bug info is asynchronously fetched from the Bugzilla REST API.
 */
@customElement("bug-label")
export class BugLabel extends LitElement {
  // ID of the bug to display. Must be a valid bugzilla bug ID.
  @property({ type: String }) bugId = "";

  // Holds the bug info fetched from the Bugzilla REST API.
  @state() private bugInfo: { isOpen: boolean; summary: string } | null = null;

  static styles = css`
    :host {
      display: inline-block;
    }
    .bug-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5em;
      text-decoration: none;
      color: inherit;
    }
    .bug-label:hover {
      text-decoration: underline;
    }
    .bug-icon {
      transition: filter 0.2s ease;
    }
    .bug-icon.closed {
      filter: grayscale(100%);
      opacity: 0.7;
    }
  `;

  /**
   * Get bug info from Bugzilla REST API
   *
   * @param {String} bugNumber
   * @returns {null|Object} Info object of bug or null if not found
   */
  async bugzillaGetBugInfo(
    bugNumber: string,
  ): Promise<{ isOpen: boolean; summary: string } | null> {
    const response = await fetch(
      `https://bugzilla.mozilla.org/rest/bug/${bugNumber}?include_fields=is_open,summary`,
    );
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Error while contacting Bugzilla API");
    }
    const info = await response.json();

    if (info.bugs.length === 0) {
      return null;
    }
    return { isOpen: info.bugs[0].is_open, summary: info.bugs[0].summary };
  }

  /**
   * Trigger fetching the bug info when the component is first updated.
   */
  firstUpdated() {
    this.fetchBugInfo();
  }

  /**
   * Fetch the bug info from the Bugzilla REST API.
   */
  private async fetchBugInfo() {
    if (!this.bugId) return;

    try {
      this.bugInfo = await this.bugzillaGetBugInfo(this.bugId);
      if (this.bugInfo?.summary) {
        this.bugInfo.summary = `Bug ${this.bugId}: ${this.bugInfo.summary}`;
      }
    } catch (err) {
      console.error(`Failed to fetch bug info for bug ${this.bugId}:`, err);
      this.bugInfo = {
        isOpen: false,
        summary: `Error fetching bug info for bug ${this.bugId}`,
      };
    }
  }

  render() {
    return html`
      <a
        class="bug-label"
        href="https://bugzilla.mozilla.org/show_bug.cgi?id=${this.bugId}"
        target="_blank"
        rel="noopener noreferrer"
        title=${this.bugInfo?.summary || "Loading bug info..."}
      >
        <img
          class="bug-icon ${this.bugInfo && !this.bugInfo.isOpen ? "closed" : ""}"
          src=${bugzillaIcon}
          alt="Bugzilla Icon"
          width="32"
          height="32"
        />
      </a>
    `;
  }
}
