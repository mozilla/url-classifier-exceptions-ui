/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Provides basic type definitions for mozjexl.
// Only the properties that are used in this project are defined.

declare module "mozjexl" {
  /**
   * A transform function that can be used in JEXL expressions. Transform
   * functions receive the value to be transformed as the first argument,
   * followed by any additional arguments passed to the transform.
   */
  export type TransformFunction = (
    value: unknown,
    ...args: unknown[]
  ) => unknown | Promise<unknown>;

  /**
   * A map of transform names to their corresponding transform functions.
   */
  export interface Transforms {
    [key: string]: TransformFunction;
  }

  /**
   * The context object passed to JEXL expressions, containing variables
   * accessible during evaluation.
   */
  export interface JexlContext {
    [key: string]: unknown;
  }

  /**
   * The main JEXL class for parsing and evaluating expressions.
   */
  export class Jexl {
    constructor();
    /**
     * Adds multiple transform functions at once.
     * @param map A map of transform names to transform functions
     */
    addTransforms(map: Transforms): void;

    /**
     * Evaluates a JEXL expression within an optional context.
     * @param expression The JEXL expression to be evaluated
     * @param context A mapping of variables to values, which will be made
     * accessible to the JEXL expression
     * @returns A Promise that resolves with the result of the evaluation
     */
    eval(expression: string, context?: JexlContext): Promise<unknown>;
  }

  // The default export is an instance of Jexl
  const mozjexl: Jexl & {
    Jexl: typeof Jexl;
  };

  export default mozjexl;
}
