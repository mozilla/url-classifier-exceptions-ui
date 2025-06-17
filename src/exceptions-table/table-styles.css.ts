/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { css } from "lit";

// Common styles for all tables.
export default css`
  .table-container {
    overflow-x: auto;
    margin: 1rem 0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    background: var(--bg-color, #fff);
  }
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 800px;
    background: inherit;
  }
  th,
  td {
    padding: 0.6em 1em;
    text-align: left;
    border-bottom: 1px solid var(--border-color, #eee);
    vertical-align: middle;
    font-size: 0.97em;
  }
  th {
    background: var(--bg-color, #fafbfc);
    color: var(--heading-color, #222);
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  tr:nth-child(even) {
    background: rgba(0, 0, 0, 0.02);
  }
  tr:hover {
    background: rgba(0, 102, 204, 0.07);
    transition: background 0.2s;
  }
  .hidden-col {
    display: none;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3em;
  }
`;
