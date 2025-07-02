/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

/**
 * A simple badge component with different styles for different types.
 */
@customElement("ui-badge")
export class UIBadge extends LitElement {
  @property({ type: String }) type = "";
  @property({ type: String }) value = "";

  static styles = css`
    :host {
      display: inline-block;
    }
    .badge {
      display: inline-block;
      padding: 0.18em 0.7em;
      font-size: 0.92em;
      border-radius: 1em;
      background: #e0e7ef;
      color: #234;
      font-weight: 500;
      line-height: 1.3;
      border: 1px solid #c3d0e6;
      margin-bottom: 2px;
      white-space: nowrap;
      user-select: text;
      text-decoration: none;
      transition:
        box-shadow 0.15s,
        background 0.15s;
    }
    .badge-category-baseline {
      background: #e0f7e9;
      color: #1b6e3a;
      border-color: #b6e6c7;
    }
    .badge-category-convenience {
      background: #fff4e0;
      color: #a05a00;
      border-color: #ffe0b3;
    }
  `;

  render() {
    // Compose class from type and value if present
    let badgeClass = "badge";
    if (this.type) {
      badgeClass += ` badge-${this.type}`;
      if (this.value) {
        badgeClass += `-${this.value}`;
      }
    }
    return html`<span class="${badgeClass}"><slot></slot></span>`;
  }
}
