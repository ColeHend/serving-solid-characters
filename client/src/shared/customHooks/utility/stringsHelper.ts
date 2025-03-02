/**
 * Converts a camelCase or PascalCase string to a spaced string with each word starting with a capital letter.
 * @param str - The camelCase or PascalCase string.
 * @returns The formatted string.
 */
export function toDisplayFormat(str: string): string {
  return str.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase()).trim();
}

/**
 * Recursively formats the keys of an object for display as table headers.
 * @param obj - The object to be formatted.
 * @returns A new object with formatted keys.
 */
export function formatKeysForDisplay(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => formatKeysForDisplay(item));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const displayKey = toDisplayFormat(key);
      acc[displayKey] = formatKeysForDisplay(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

