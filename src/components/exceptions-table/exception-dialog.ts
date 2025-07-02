/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ExceptionListEntry } from "../../types";

/**
 * Dialog for showing a raw exception entry.
 */
@customElement("exception-dialog")
export class ExceptionDialog extends LitElement {
  // Callers can either pass a single entry or an array of entries.
  @property({ type: Object })
  entry?: ExceptionListEntry;

  @property({ type: Array })
  entries?: ExceptionListEntry[];

  static styles = css`
    dialog {
      padding: 1.5rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-color);
      color: var(--text-color);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .dialog-header h2 {
      margin: 0;
      color: var(--heading-color);
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0.25rem;
      color: var(--text-secondary);
    }

    .close-button:hover {
      color: var(--text-color);
    }

    pre {
      background: var(--bg-color);
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0;
      font-family: monospace;
      font-size: 0.9rem;
      line-height: 1.4;
      border: 1px solid var(--border-color);
    }
  `;

  /**
   * Close the dialog when the close button is clicked.
   * @param e The mouse event.
   */
  private onCloseButtonClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      const dialog = this.renderRoot.querySelector("dialog");
      if (dialog) {
        dialog.close();
      }
    }
  }

  /**
   * Disables page scroll while the dialog is open.
   */
  private disablePageScroll() {
    document.body.style.overflow = "hidden";
  }

  /**
   * Enables page scroll when the dialog is closed.
   */
  private enablePageScroll() {
    document.body.style.overflow = "";
  }

  /**
   * Shows the dialog.
   */
  show() {
    const dialog = this.renderRoot.querySelector("dialog");
    if (dialog) {
      this.disablePageScroll();
      dialog.showModal();
    }
  }

  render() {
    let json = this.entry ?? this.entries;

    const formattedJson = JSON.stringify(json, null, 2);

    return html`
      <dialog @close=${this.enablePageScroll} @click=${this.onCloseButtonClick}>
        <div class="dialog-header">
          <h2>Exception Details</h2>
          <button class="close-button" @click=${this.onCloseButtonClick}>&times;</button>
        </div>
        <pre>${formattedJson}</pre>
      </dialog>
    `;
  }
}
