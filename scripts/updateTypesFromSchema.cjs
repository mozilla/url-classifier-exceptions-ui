/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require("fs");
const path = require("path");
const { compile } = require("json-schema-to-typescript");
require("dotenv").config();

const RS_ENDPOINTS = {
  prod: "https://firefox.settings.services.mozilla.com",
  stage: "https://firefox.settings.services.allizom.org",
  dev: "https://remote-settings-dev.allizom.org",
};

/**
 * Get the Remote Settings endpoint to use.
 * Can be overridden by setting VITE_RS_ENVIRONMENT in .env to one of: "prod", "stage", "dev"
 * Defaults to "prod" if not set or invalid
 */
function getRSEndpoint() {
  const env = process.env.VITE_RS_ENVIRONMENT;
  return RS_ENDPOINTS[env] || RS_ENDPOINTS.prod;
}

async function generateTypes() {
  try {
    // Fetch the schema from Remote Settings
    const rsOrigin = getRSEndpoint();
    console.info(`Fetching schema from ${rsOrigin}`);

    const response = await fetch(
      `${rsOrigin}/v1/buckets/main/collections/url-classifier-exceptions`,
    );
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
