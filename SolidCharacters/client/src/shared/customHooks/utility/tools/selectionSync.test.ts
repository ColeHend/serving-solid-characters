import { describe, it, expect, vi } from 'vitest';
import { createRoot, createSignal } from 'solid-js';
import { createSelectionSync } from './selectionSync';

interface Row {
  name?: string;
  legacy?: boolean;
  id?: string;
  __homebrew?: boolean;
}

function setup(opts: { current?: Row; selected?: Row; list?: Row[] }) {
  const [selected, setSelected] = createSignal<Row | undefined>(opts.selected);
  const [list, setList] = createSignal<Row[]>(opts.list ?? (opts.selected ? [opts.selected] : []));
  const [current, setCurrent] = createSignal<Row | undefined>(opts.current);
  const setSpy = vi.fn((v: Row) => setCurrent(v));
  const dispose = createRoot(d => {
    createSelectionSync<Row>({
      selected,
      list,
      current: [current, setSpy],
      nameOf: r => r.name,
    });
    return d;
  });
  return { setSelected, setList, current, setCurrent, setSpy, dispose };
}

describe('createSelectionSync', () => {
  it('resolves a deep link when nothing is selected yet', () => {
    const row = { name: 'Fireball', legacy: true };
    const { current, setSpy, dispose } = setup({ selected: row });

    expect(current()).toBe(row);
    expect(setSpy).toHaveBeenCalledTimes(1);
    dispose();
  });

  it('does not clobber a same-named click with the lookup result', () => {
    // The user clicked the 2024 copy; the ?name= lookup resolves to the 2014 duplicate.
    const lookedUp = { name: 'Fireball', legacy: true, id: 'f14' };
    const clicked = { name: 'Fireball', legacy: false, id: 'f24' };
    const { current, setSpy, dispose } = setup({
      current: clicked,
      selected: lookedUp,
      list: [lookedUp, clicked],
    });

    expect(current()).toBe(clicked);
    expect(setSpy).not.toHaveBeenCalled();
    dispose();
  });

  it('compares names case-insensitively and ignoring whitespace', () => {
    const lookedUp = { name: 'Fireball', legacy: true };
    const clicked = { name: 'fireball ', legacy: false };
    const { current, setSpy, dispose } = setup({
      current: clicked,
      selected: lookedUp,
      list: [lookedUp, clicked],
    });

    expect(current()).toBe(clicked);
    expect(setSpy).not.toHaveBeenCalled();
    dispose();
  });

  it('re-points at the fresh copy of the same entity when the list is rebuilt', () => {
    // A homebrew edit re-emits the aggregator with brand-new row objects.
    const srdZap = { name: 'Zap', legacy: true, id: 'z1' };
    const hbZapV1 = { name: 'Zap', __homebrew: true };
    const { setList, current, dispose } = setup({
      current: hbZapV1,
      selected: srdZap,
      list: [srdZap, hbZapV1],
    });
    expect(current()).toBe(hbZapV1);

    const hbZapV2 = { name: 'Zap', __homebrew: true };
    setList([srdZap, hbZapV2]);

    // Selection must move to the fresh homebrew copy, NOT the first name match.
    expect(current()).toBe(hbZapV2);
    dispose();
  });

  it('falls back to the lookup result when the current entity leaves the list', () => {
    // Ruleset switch 2014 -> 2024: the 2014 copy disappears from the merged list.
    const fire2014 = { name: 'Fireball', legacy: true, id: 'f14' };
    const fire2024 = { name: 'Fireball', legacy: false, id: 'f24' };
    const { setSelected, setList, current, dispose } = setup({
      current: fire2014,
      selected: fire2014,
      list: [fire2014],
    });

    setList([fire2024]);
    setSelected(fire2024);

    expect(current()).toBe(fire2024);
    dispose();
  });

  it('updates when the derived selection changes to a different name', () => {
    const fireball = { name: 'Fireball' };
    const { setSelected, setList, current, dispose } = setup({ selected: fireball });

    const aid = { name: 'Aid' };
    setList([fireball, aid]);
    setSelected(aid);

    expect(current()).toBe(aid);
    dispose();
  });

  it('does nothing while the selection is unresolved', () => {
    const { current, setSpy, dispose } = setup({});

    expect(current()).toBeUndefined();
    expect(setSpy).not.toHaveBeenCalled();
    dispose();
  });

  it('does not track the current signal (no self-loop)', () => {
    const fireball = { name: 'Fireball' };
    const { current, setCurrent, setSpy, dispose } = setup({ selected: fireball });
    expect(setSpy).toHaveBeenCalledTimes(1);

    // Writing current directly (as a row click does) must not re-run the effect.
    const clicked = { name: 'Fireball', legacy: false };
    setCurrent(clicked);

    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(current()).toBe(clicked);
    dispose();
  });
});
