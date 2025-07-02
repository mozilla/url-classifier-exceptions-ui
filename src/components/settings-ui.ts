/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { RSEnvironment } from "../../scripts/rs-config.js";
import { FirefoxChannel, FirefoxVersions } from "../types.js";

/**
 * Custom event for RS environment changes.
 */
export class RSEnvChangeEvent extends CustomEvent<{
  rsEnv: RSEnvironment;
  rsEnvUsePreview: boolean;
}> {
  constructor(detail: { rsEnv: RSEnvironment; rsEnvUsePreview: boolean }) {
    super("rs-env-change", { detail, bubbles: true, composed: true });
  }
}

/**
 * Custom event for Firefox channel filter changes.
 */
export class FirefoxChannelFilterChangeEvent extends CustomEvent<{
  filterFirefoxChannel: FirefoxChannel | null;
}> {
  constructor(detail: { filterFirefoxChannel: FirefoxChannel | null }) {
    super("firefox-channel-filter-change", { detail, bubbles: true, composed: true });
  }
}

/**
 * A component for displaying and managing UI settings.
 */
@customElement("settings-ui")
export class Settings extends LitElement {
  // The Remote Settings environment to use.
  @property({ type: String, attribute: false })
  rsEnv: RSEnvironment = "prod";

  // Whether to use the preview environment.
  @property({ type: Boolean, attribute: false })
  rsEnvUsePreview: boolean = false;

  // Holds the version numbers for each Firefox release channel.
  @property({ type: Object, attribute: false })
  firefoxVersions: FirefoxVersions | null = null;

  // The currently selected Firefox version filter.
  @property({ type: String, attribute: false })
  filterFirefoxChannel: FirefoxChannel | null = null;

  static styles = css`
    details summary {
      cursor: pointer;
      user-select: none;
      color: var(--text-color);
      font-family: var(--font-family);
    }

    #settings-content {
      padding: 1.5rem 2rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 1rem 1.5rem;
      align-items: center;
      max-width: 480px;
    }

    #settings-content label {
      justify-self: end;
      margin-right: 0.5rem;
      font-weight: 500;
      color: var(--text-color);
      font-family: var(--font-family);
    }

    #settings-content select {
      margin-left: 0.5rem;
      font-size: 1rem;
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      font-family: var(--font-family);
    }

    #settings-content input[type="checkbox"] {
      transform: scale(1.2);
      accent-color: var(--link-color);
    }

    @media (max-width: 600px) {
      #settings-content {
        grid-template-columns: 1fr;
        padding: 1rem;
        max-width: 100%;
      }
      #settings-content label {
        justify-self: start;
        margin-right: 0;
      }
    }
  `;

  /**
   * Handle changes to RS environment settings via the UI.
   * @param event The change event either the dropdown or the checkbox.
   */
  private handleRSEnvChange(event: Event) {
    const target = event.target as HTMLSelectElement | HTMLInputElement;

    if (target.id === "rs-env") {
      this.rsEnv = (target as HTMLSelectElement).value as RSEnvironment;
      // Reset preview setting when environment changes.
      this.rsEnvUsePreview = false;
    } else if (target.id === "rs-env-preview") {
      this.rsEnvUsePreview = (target as HTMLInputElement).checked;
    }

    // Emit the change event
    this.dispatchEvent(
      new RSEnvChangeEvent({
        rsEnv: this.rsEnv,
        rsEnvUsePreview: this.rsEnvUsePreview,
      }),
    );
  }

  /**
   * Handle changes to the Firefox version filter via the UI.
   * @param event The change event.
   */
  private handleFirefoxChannelFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;

    this.filterFirefoxChannel = target.value as FirefoxChannel;

    // Emit the change event
    this.dispatchEvent(
      new FirefoxChannelFilterChangeEvent({
        filterFirefoxChannel: this.filterFirefoxChannel,
      }),
    );
  }

  render() {
    return html`
      <details>
        <summary>UI Settings</summary>
        <div id="settings-content">
          <label for="fx-version">Firefox Version:</label>
          <select
            id="fx-version"
            @change=${this.handleFirefoxChannelFilterChange}
            ?disabled=${!this.firefoxVersions}
          >
            <option value="" ?selected=${this.filterFirefoxChannel === null}>All</option>
            <option value="nightly" ?selected=${this.filterFirefoxChannel === "nightly"}
              >Nightly (${this.firefoxVersions?.nightly})</option
            >
            <option value="beta" ?selected=${this.filterFirefoxChannel === "beta"}
              >Beta (${this.firefoxVersions?.beta})</option
            >
            <option value="release" ?selected=${this.filterFirefoxChannel === "release"}
              >Release (${this.firefoxVersions?.release})</option
            >
          </select>

          <label for="rs-env">Remote Settings Environment:</label>
          <select id="rs-env" @change=${this.handleRSEnvChange}>
            <option value="prod" ?selected=${this.rsEnv === "prod"}>Prod</option>
            <option value="stage" ?selected=${this.rsEnv === "stage"}>Stage</option>
            <option value="dev" ?selected=${this.rsEnv === "dev"}>Dev</option>
          </select>

          <label for="rs-env-preview">Include changes pending review:</label>
          <input
            id="rs-env-preview"
            type="checkbox"
            ?checked=${this.rsEnvUsePreview}
            @change=${this.handleRSEnvChange}
          />
        </div>
      </details>
    `;
  }
}
