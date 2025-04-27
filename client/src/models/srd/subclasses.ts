import { APIReference } from "./core";

/**
 * Represents the response from GET /api/subclasses.
 * It returns a list of minimal subclass references.
 */
export interface SubclassesList {
  count: number;
  results: APIReference[];
}

/**
 * Represents the detailed data for a subclass.
 *
 * Example response for a subclass (e.g., Path of the Berserker):
 * {
 *   "index": "berserker",
 *   "name": "Path of the Berserker",
 *   "class": {
 *     "index": "barbarian",
 *     "name": "Barbarian",
 *     "url": "/api/classes/barbarian"
 *   },
 *   "subclass_levels": "/api/subclasses/berserker/levels",
 *   "desc": [
 *     "At 3rd level, when you choose this path, you can go into a frenzy..."
 *   ],
 *   "features": [
 *     {
 *       "index": "frenzy",
 *       "name": "Frenzy",
 *       "url": "/api/features/frenzy"
 *     }
 *   ],
 *   "url": "/api/subclasses/berserker"
 * }
 */
export interface DnDSubclass {
  index: string;
  name: string;
  /** A reference to the parent class for this subclass */
  class: APIReference;
  /** URL for accessing the subclass levels resource */
  subclass_levels: string;
  /** A list of strings describing the subclass features or lore */
  desc: string[];
  /** A list of feature references associated with this subclass */
  features: APIReference[];
  /** The URL for this subclass resource */
  url: string;
}
