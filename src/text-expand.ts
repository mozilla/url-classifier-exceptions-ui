import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
// FIXME: When the text expands causing a line break the expand animation glitches.

@customElement("text-expand")
export class TextExpand extends LitElement {
  @property({ type: String }) text = "";
  @property({ type: String }) expandedText = "";

  static readonly styles = css`
    .container {
      display: inline-flex;
      align-items: baseline;
      cursor: pointer;
      border-bottom: 1px dotted var(--text-color);
      outline: none;
    }

    .container:focus-visible {
      outline: 2px solid var(--link-color);
      outline-offset: 2px;
    }

    .container:hover .expanded-text,
    .container:focus .expanded-text {
      max-width: 200px;
    }

    .expanded-text {
      display: inline-block;
      max-width: 0;
      overflow: hidden;
      transition:
        max-width 0.3s ease-in-out,
        opacity 0.2s ease-in-out;
      white-space: pre;
      line-height: inherit;
    }

    @media (prefers-reduced-motion: reduce) {
      .expanded-text {
        transition: none;
      }
    }
  `;

  render() {
    const fullText = `${this.text}${this.expandedText}`;
    return html` <span
      class="container"
      tabindex="0"
      role="button"
      aria-expanded="false"
      aria-label="${fullText}"
    >
      ${this.text}<span class="expanded-text" aria-hidden="true">${this.expandedText}</span>
    </span>`;
    // Note that the string can't end in a newline, otherwise a whitespace is
    // added to the end of the text which can be undesirable for some of the
    // consumers.
  }
}
