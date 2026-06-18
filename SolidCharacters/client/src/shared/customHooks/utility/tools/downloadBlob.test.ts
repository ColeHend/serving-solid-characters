import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadBlob } from './downloadBlob';

describe('downloadBlob', () => {
  let createSpy: ReturnType<typeof vi.fn>;
  let revokeSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;
  let lastAnchor: HTMLAnchorElement | undefined;
  const origCreate = URL.createObjectURL;
  const origRevoke = URL.revokeObjectURL;

  beforeEach(() => {
    createSpy = vi.fn(() => 'blob:fake-url');
    revokeSpy = vi.fn();
    URL.createObjectURL = createSpy as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeSpy as unknown as typeof URL.revokeObjectURL;

    clickSpy = vi.fn();
    lastAnchor = undefined;
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === 'a') {
        lastAnchor = el as HTMLAnchorElement;
        (el as HTMLAnchorElement).click = clickSpy;
      }
      return el;
    });
  });

  afterEach(() => {
    URL.createObjectURL = origCreate;
    URL.revokeObjectURL = origRevoke;
    vi.restoreAllMocks();
  });

  it('builds a Blob of the given mime, clicks an anchor with the filename, and revokes the URL', () => {
    downloadBlob(new Uint8Array([1, 2, 3]), 'hero.pdf', 'application/pdf');

    expect(createSpy).toHaveBeenCalledTimes(1);
    const blob = createSpy.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');

    expect(lastAnchor?.download).toBe('hero.pdf');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith('blob:fake-url');
  });

  it('accepts a string payload too (generalizes downloadObjectAsJson)', () => {
    downloadBlob('{"a":1}', 'data.json', 'application/json');
    const blob = createSpy.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    expect(lastAnchor?.download).toBe('data.json');
  });
});
