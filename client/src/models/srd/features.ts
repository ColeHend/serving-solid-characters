import { APIReference } from "./core";

/**
 * Represents the detailed data for a D&D feature.
 *
 * Example JSON:
 * {
 *   "index": "action-surge",
 *   "name": "Action Surge",
 *   "class": {
 *     "index": "fighter",
 *     "name": "Fighter",
 *     "url": "/api/classes/fighter"
 *   },
 *   "desc": [
 *     "Starting at 2nd level, you can push yourself beyond your normal limits for a moment."
 *   ],
 *   "prerequisites": [
 *     "Fighter level 2"
 *   ],
 *   "url": "/api/features/action-surge"
 * }
 */
export interface DnDFeature {
  /** A unique index string for the feature */
  index: string;
  /** The name of the feature */
  name: string;
  /**
   * A reference to the class that this feature belongs to.
   * Some features may not have an associated class, so this field is optional.
   */
  class?: APIReference;
  /** A list of descriptions or details about the feature */
  desc: string[];
  /**
   * Optional prerequisites for the feature.
   * These might be conditions or level requirements.
   */
  prerequisites?: string[];
  /** The URL endpoint for this feature resource */
  url: string;
}
