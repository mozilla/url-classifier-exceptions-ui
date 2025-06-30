/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { compile } from "json-schema-to-typescript";
import { getRSEndpointMeta } from "./rs-config.js";
import "dotenv/config";

/**
 * Get the Remote Settings endpoint to use.
 * Can be overridden by setting VITE_RS_ENVIRONMENT in .env to one of: "prod",
 * "prod_preview", "stage", "stage_preview", "dev", "dev_preview".
 * Defaults to "prod" if not set or invalid
 */
function getRSUrl() {
  const env = process.env.VITE_RS_ENVIRONMENT || "prod";
  return getRSEndpointMeta(env, false);
}

async function generateTypes() {
  try {
    // Fetch the schema from Remote Settings collection metadata
    const rsUrl = getRSUrl();
    console.info(`Fetching schema from ${rsUrl.toString()}`);

    const response = await fetch(rsUrl.toString());
    const data = await response.json();
    const schema = data.data.schema;

    // Generate TypeScript types
    const types = await compile(schema, "URLClassifierExceptionListEntry", {
      bannerComment: "// This file is auto-generated. Do not edit manually.\n",
      style: {
        singleQuote: true,
        semi: true,
      },
    });

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const srcDir = path.join(__dirname, "..", "src");

    // Write the types to a file
    const outputPath = path.join(srcDir, "url-classifier-exception-list-types.ts");
    fs.writeFileSync(outputPath, types);
    console.log(`Types generated successfully at ${outputPath}`);
  } catch (error) {
    console.error("Error generating types:", error);
    process.exit(1);
  }
}

generateTypes();
