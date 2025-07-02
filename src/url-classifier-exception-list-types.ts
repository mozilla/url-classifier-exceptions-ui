// This file is auto-generated. Do not edit manually.

/**
 * A JEXL to filter records. See https://remote-settings.readthedocs.io/en/latest/target-filters.html#how
 */
export type FilterExpression = string;

/**
 * Represents an entry in the URL classifier exception list
 */
export interface URLClassifierExceptionListEntry {
  /**
   * The auto-generated id of the exception list entry.
   */
  id?: string;
  /**
   * The IDs of the bugs this exception is added for.
   *
   * @minItems 1
   */
  bugIds: [string, ...string[]];
  /**
   * The category of the exception entry.
   */
  category: 'baseline' | 'convenience';
  /**
   * The urlPattern for the url to be loaded. See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns for more info.
   */
  urlPattern: string;
  filter_expression?: FilterExpression;
  /**
   * The list of url classifier features to apply this exception to.
   */
  classifierFeatures: (
    | 'blockedURIs'
    | 'cryptomining-annotation'
    | 'cryptomining-protection'
    | 'emailtracking-protection'
    | 'emailtracking-data-collection'
    | 'fingerprinting-annotation'
    | 'fingerprinting-protection'
    | 'malware'
    | 'phishing'
    | 'socialtracking-annotation'
    | 'socialtracking-protection'
    | 'tracking-annotation'
    | 'tracking-protection'
  )[];
  /**
   * Optional top-level url pattern to filter for this exception. If not set the exception applies to all top level sites.
   */
  topLevelUrlPattern?: string;
  /**
   * Whether this exception only applies in private browsing mode
   */
  isPrivateBrowsingOnly?: boolean;
  /**
   * Optional array of content blocking categories to filter for this exception. If not set the exception applies to all content blocking categories.
   */
  filterContentBlockingCategories?: ('standard' | 'strict' | 'custom')[];
  [k: string]: unknown;
}
