import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import bugzillaIcon from "./assets/bugzilla-icon.svg";

@customElement("bug-label")
export class BugLabel extends LitElement {
  @property({ type: String }) bugId = "";
  @state() private bugInfo: { isOpen: boolean; summary: string } | null = null;
  @state() private loading = true;

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

  firstUpdated() {
    this.fetchBugInfo();
  }

  private async fetchBugInfo() {
    if (!this.bugId) return;

    try {
      this.loading = true;
      this.bugInfo = await this.bugzillaGetBugInfo(this.bugId);
    } catch (err) {
      console.error(`Failed to fetch bug info for bug ${this.bugId}:`, err);
      this.bugInfo = { isOpen: false, summary: "Error fetching bug info" };
    } finally {
      this.loading = false;
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
