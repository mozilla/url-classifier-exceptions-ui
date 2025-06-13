import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ui-badge")
export class UIBadge extends LitElement {
  @property({ type: String }) type = "";
  @property({ type: String }) value = "";
  @property({ type: String }) href = "";

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
    a.badge:hover,
    a.badge:focus {
      box-shadow: 0 0 0 2px #b3d8ff;
      background: #f0f8ff;
      outline: none;
      cursor: pointer;
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
    .badge-private {
      background: #e0e7ff;
      color: #2a3fa0;
      border-color: #b3c2ff;
    }
    .badge-all {
      background: #e7f0e0;
      color: #3a6e1b;
      border-color: #c7e6b6;
    }
    .badge-etp-standard {
      background: #e0f0ff;
      color: #005a8c;
      border-color: #b3d8ff;
    }
    .badge-etp-strict {
      background: #ffe0e0;
      color: #a01b1b;
      border-color: #ffb3b3;
    }
    .badge-etp-custom {
      background: #f3e0ff;
      color: #6e1ba0;
      border-color: #dab3ff;
    }
    .badge-feature {
      background: #f0f4fa;
      color: #234;
      border-color: #d0d8e6;
    }
    .badge-bug {
      background: #f5e0ff;
      color: #7a1ba0;
      border-color: #e6b3ff;
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
    if (this.href) {
      return html`<a
        class="${badgeClass}"
        href="${this.href}"
        target="_blank"
        rel="noopener noreferrer"
        ><slot></slot
      ></a>`;
    }
    return html`<span class="${badgeClass}"><slot></slot></span>`;
  }
}
