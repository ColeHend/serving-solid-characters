import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSignal } from 'solid-js';
import { render, cleanup } from '@solidjs/testing-library';

// Mock the single render path so the preview is exercised without real pdf-lib.
const { genMock } = vi.hoisted(() => ({ genMock: vi.fn() }));
vi.mock('../../../shared/sheetMapping/pdf/generateSheetPdf', () => ({ generateSheetPdf: genMock }));

import { SheetPreview } from './sheetPreview';

const PDF_BYTES = new Uint8Array([37, 80, 68, 70]); // "%PDF"
const tmpl = (fieldCount: number) =>
  ({ templateId: 'default', name: 't', version: 1, fields: Array.from({ length: fieldCount }), updatedAt: 0 }) as any;

describe('SheetPreview live regen', () => {
  let createSpy: ReturnType<typeof vi.fn>;
  let revokeSpy: ReturnType<typeof vi.fn>;
  let counter: number;

  beforeEach(() => {
    vi.useFakeTimers();
    counter = 0;
    genMock.mockReset();
    genMock.mockResolvedValue(PDF_BYTES);
    createSpy = vi.fn(() => `blob:${++counter}`);
    revokeSpy = vi.fn();
    globalThis.URL.createObjectURL = createSpy as unknown as typeof URL.createObjectURL;
    globalThis.URL.revokeObjectURL = revokeSpy as unknown as typeof URL.revokeObjectURL;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('debounces rapid changes into one regen and sets the iframe src', async () => {
    const [values, setValues] = createSignal<Record<string, string>>({ a: '1' });
    const [template] = createSignal(tmpl(1));
    const [page] = createSignal(0);
    const { container } = render(() => <SheetPreview values={values} template={template} activePage={page} />);

    setValues({ a: '2' });
    setValues({ a: '3' });
    await vi.advanceTimersByTimeAsync(250);

    expect(genMock).toHaveBeenCalledTimes(1);
    // Third arg = spell rows ([] with no `spells` prop); fourth = feature lists ({} with no `featureLists` prop).
    expect(genMock).toHaveBeenLastCalledWith({ a: '3' }, tmpl(1), [], {});
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe('blob:1');
  });

  it('forwards the featureLists accessor as the fourth generate arg', async () => {
    const [values] = createSignal<Record<string, string>>({ a: '1' });
    const [template] = createSignal(tmpl(1));
    const [page] = createSignal(0);
    const lists = { classFeatures: [{ name: 'X', description: 'y' }] } as any;
    const [featureLists] = createSignal(lists);
    render(() => (
      <SheetPreview values={values} template={template} activePage={page} featureLists={featureLists} />
    ));
    await vi.advanceTimersByTimeAsync(250);
    expect(genMock).toHaveBeenLastCalledWith({ a: '1' }, tmpl(1), [], lists);
  });

  it('revokes the previous object URL on the next regen', async () => {
    const [values, setValues] = createSignal<Record<string, string>>({ a: '1' });
    const [template] = createSignal(tmpl(1));
    const [page] = createSignal(0);
    render(() => <SheetPreview values={values} template={template} activePage={page} />);
    await vi.advanceTimersByTimeAsync(250); // → blob:1
    setValues({ a: '2' });
    await vi.advanceTimersByTimeAsync(250); // → blob:2, revoke blob:1
    expect(revokeSpy).toHaveBeenCalledWith('blob:1');
  });

  it('is latest-wins: a stale (out-of-order) result is discarded', async () => {
    let resolveFirst: (v: Uint8Array) => void = () => {};
    genMock.mockImplementationOnce(() => new Promise<Uint8Array>((r) => (resolveFirst = r)));
    genMock.mockImplementationOnce(() => Promise.resolve(PDF_BYTES));

    const [values, setValues] = createSignal<Record<string, string>>({ a: '1' });
    const [template] = createSignal(tmpl(1));
    const [page] = createSignal(0);
    const { container } = render(() => <SheetPreview values={values} template={template} activePage={page} />);

    await vi.advanceTimersByTimeAsync(250); // first regen → pending
    setValues({ a: '2' });
    await vi.advanceTimersByTimeAsync(250); // second regen → resolves → blob:1

    resolveFirst(PDF_BYTES); // stale first now resolves
    await Promise.resolve();

    expect(container.querySelector('iframe')?.getAttribute('src')).toBe('blob:1');
    expect(createSpy).toHaveBeenCalledTimes(1); // stale never created a URL
  });

  it('cancels the pending timer and revokes on unmount (no regen after unmount)', async () => {
    const [values] = createSignal<Record<string, string>>({ a: '1' });
    const [template] = createSignal(tmpl(1));
    const [page] = createSignal(0);
    const { unmount } = render(() => <SheetPreview values={values} template={template} activePage={page} />);

    await vi.advanceTimersByTimeAsync(250);
    expect(createSpy).toHaveBeenCalledTimes(1);

    unmount();
    expect(revokeSpy).toHaveBeenCalledWith('blob:1');

    genMock.mockClear();
    await vi.advanceTimersByTimeAsync(1000);
    expect(genMock).not.toHaveBeenCalled();
  });
});
