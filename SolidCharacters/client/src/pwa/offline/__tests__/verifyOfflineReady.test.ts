import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isDatasetOk, writeNonEmptySnapshot, readNonEmptySnapshot } from '../verifyOfflineReady';

// Guards the offline-readiness regression where a legitimately-empty SRD dataset (/api/2024/Subraces
// returns []) was reported as "missing", so the app could never show "available offline".

describe('isDatasetOk (empty-dataset handling)', () => {
  it('treats any dataset with rows as ok, regardless of snapshot', () => {
    expect(isDatasetOk(5, '2024 spells', null)).toBe(true);
    expect(isDatasetOk(5, '2024 spells', [])).toBe(true);
    expect(isDatasetOk(1, '2024 subraces', [])).toBe(true);
  });

  it('with no snapshot, an empty dataset is strict-failed (conservative; self-corrects on next download)', () => {
    expect(isDatasetOk(0, '2024 subraces', null)).toBe(false);
  });

  it('a known-empty dataset (absent from the non-empty snapshot) passes when empty', () => {
    const snapshot = ['2024 spells', '2024 classes']; // subraces intentionally absent = loaded-but-empty
    expect(isDatasetOk(0, '2024 subraces', snapshot)).toBe(true);
  });

  it('a previously non-empty dataset that is now empty is flagged (eviction detection)', () => {
    const snapshot = ['2024 spells'];
    expect(isDatasetOk(0, '2024 spells', snapshot)).toBe(false);
  });
});

describe('non-empty snapshot round-trip', () => {
  // Self-contained in-memory localStorage so the test is independent of the vitest environment.
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => { store.set(k, String(v)); },
      removeItem: (k: string) => { store.delete(k); },
      clear: () => { store.clear(); },
      key: (i: number) => [...store.keys()][i] ?? null,
      get length() { return store.size; },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('writes and reads back the labels', () => {
    writeNonEmptySnapshot(['2024 spells', 'magic items']);
    expect(readNonEmptySnapshot()).toEqual(['2024 spells', 'magic items']);
  });

  it('returns null when nothing was written', () => {
    expect(readNonEmptySnapshot()).toBeNull();
  });

  it('ignores a snapshot stored under a different app version (re-derives after a deploy)', () => {
    localStorage.setItem('srdPreload:nonEmpty', JSON.stringify({ v: 'some-other-version', labels: ['x'] }));
    expect(readNonEmptySnapshot()).toBeNull();
  });

  it('returns null for an unparsable snapshot', () => {
    localStorage.setItem('srdPreload:nonEmpty', 'not-json');
    expect(readNonEmptySnapshot()).toBeNull();
  });
});
