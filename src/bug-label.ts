/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import bugzillaIcon from "./assets/bugzilla-icon.svg";
import { BugMeta } from "./types";

/**
 * A component for displaying a bug label with a bugzilla icon.
 * The bug info is asynchronously fetched from the Bugzilla REST API.
 */
@customElement("bug-label")
export class BugLabel extends LitElement {
  // Holds all bug metadata to display.
  @property({ type: Object })
  bugMeta: BugMeta = {
    id: "",
    isOpen: true,
    summary: "",
  };

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

  render() {
    return html`
      <a
        class="bug-label"
        href="https://bugzilla.mozilla.org/show_bug.cgi?id=${this.bugMeta.id}"
        target="_blank"
        rel="noopener noreferrer"
        title=${this.bugMeta.summary}
      >
        <img
          class="bug-icon ${!this.bugMeta.isOpen ? "closed" : ""}"
          src=${bugzillaIcon}
          alt="Bugzilla Icon"
          width="32"
          height="32"
        />
      </a>
    `;
  }
}
