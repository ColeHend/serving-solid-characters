/**
 * Represents a minimal reference to a resource.
 * Used in list responses and nested data.
 */
export interface APIReference {
  index: string;
  name: string;
  url: string;
}