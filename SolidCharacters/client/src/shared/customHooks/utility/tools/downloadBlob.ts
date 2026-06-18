/**
 * Generic blob download — generalizes `downloadObjectAsJson` (which only handled
 * pretty-printed JSON). Wraps `data` in a `Blob`, clicks a temporary anchor to
 * trigger the browser download, then revokes the object URL.
 *
 * `data` is any `BlobPart` (e.g. a pdf-lib `Uint8Array`, a JSON string).
 */
export function downloadBlob(data: BlobPart, filename: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
