/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import bugzillaIcon from "./assets/bugzilla-icon.svg";
import { BugMeta } from "./types";

/**
 * A component for displaying a bug label with a bugzilla icon.
 * If only a single bug is provided, it will display the bug's metadata along with a link to the bug.
 * If multiple bugs are provided, it will display a link to a Bugzilla bug list.
 */
@customElement("bug-label")
export class BugLabel extends LitElement {
  // Holds either a single bug or a list of bugs to display.
  @property({ type: Array })
  bugMeta: BugMeta[] = [];

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
   * Get the URL for a Bugzilla bug list.
   * @param bugIds The bug IDs to get the URL for.
   * @returns The URL for the list of bugs.
   */
  private getBugListUrl() {
    const url = new URL("https://bugzilla.mozilla.org/buglist.cgi");
    url.searchParams.set("bug_id", this.bugIds.join(","));
    return url.toString();
  }

  private get bugIds() {
    return this.bugMeta.map((bug) => bug.id);
  }

  private renderSingleBugLabel() {
    let bug = this.bugMeta[0];

    return html`
      <a
        class="bug-label"
        href="https://bugzilla.mozilla.org/show_bug.cgi?id=${bug.id}"
        target="_blank"
        rel="noopener noreferrer"
        title=${`Bug ${bug.id}: ${bug.summary}`}
      >
        <img
          class="bug-icon ${!bug.isOpen ? "closed" : ""}"
          src=${bugzillaIcon}
          alt="Bugzilla Icon"
          width="32"
          height="32"
        />
      </a>
    `;
  }

  private get allBugsClosed() {
    return this.bugMeta.every((bug) => !bug.isOpen);
  }

  private renderMultipleBugsLabel() {
    return html`
      <a
        class="bug-label"
        href=${this.getBugListUrl()}
        target="_blank"
        rel="noopener noreferrer"
        title=${`Bug ${this.bugIds.join(", ")}`}
      >
        <img
          class="bug-icon ${this.allBugsClosed ? "closed" : ""}"
          src=${bugzillaIcon}
          alt="Bugzilla Icon"
          width="32"
          height="32"
        />
      </a>
    `;
  }

  render() {
    if (this.bugMeta.length === 0) {
      return html``;
    }

    if (this.bugMeta.length === 1) {
      return this.renderSingleBugLabel();
    } else {
      return this.renderMultipleBugsLabel();
    }
  }
}
