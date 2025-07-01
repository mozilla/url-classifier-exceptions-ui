/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import mozjexl from "mozjexl";
import { mozCompare } from "addons-moz-compare";

const jexl = new mozjexl.Jexl();
jexl.addTransforms({
  versionCompare: (value: unknown, ...args: unknown[]) => {
    // Ensure we have two string arguments for version comparison
    if (args.length < 1) {
      throw new Error("versionCompare requires two arguments");
    }
    const a = String(value);
    const b = String(args[0]);
    return mozCompare(a, b);
  },
});

/**
 * Evaluates a JEXL-based filter expression.
 * @param expression The filter expression to evaluate.
 * @param context The context to evaluate the expression in.
 * @returns The result of the evaluation.
 */
export function evaluateFilterExpression(expression: string, context: Record<string, unknown>) {
  return jexl.eval(expression, context);
}

/**
 * Evaluates a given JEXL filter expression against a Gecko / Firefox version
 * number.
 * @param version The version number to check.
 * @param filterExpression The filter expression to evaluate.
 * @returns True if the version number matches the filter expression, false
 * otherwise.
 */
export async function versionNumberMatchesFilterExpression(
  version: string,
  filterExpression: string | undefined,
): Promise<boolean> {
  // An empty filter expression always matches.
  if (!filterExpression?.length) {
    return true;
  }

  const context = {
    env: {
      version,
    },
  };
  const result = await evaluateFilterExpression(filterExpression, context);
  console.debug(
    "Evaluating filter expression",
    filterExpression,
    "for version",
    version,
    "result",
    result,
  );

  return result === true;
}
