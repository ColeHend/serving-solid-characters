import { describe, it, expect } from 'vitest';
import { render } from '@solidjs/testing-library';
import { DragDropProvider } from '../../../shared/dnd';
import { SheetFieldDef } from '../../../shared/sheetMapping';
import { FieldCard } from './fieldCard';

// jsdom's synthetic pointer events drop clientX/clientY/pointerId, so dispatch a
// real MouseEvent (which carries coordinates) under the 'pointer*' type the
// handlers listen for. pointerId is absent on both → the same-pointer guard passes.
const press = (el: HTMLElement, type: 'pointerdown' | 'pointerup', x: number, y: number) =>
  el.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }));

const DEF: SheetFieldDef = {
  key: 'str',
  label: 'Strength Score',
  group: 'Abilities',
  description: 'Strength ability score.',
};

const renderCard = (onAdd: (k: string) => void = () => {}) =>
  render(() => (
    <DragDropProvider>
      <FieldCard def={DEF} placed={false} value={() => '16'} onGrab={() => {}} onAdd={onAdd} />
    </DragDropProvider>
  ));

describe('FieldCard', () => {
  it('renders the label, description, sample value, and a drag handle', () => {
    const { container, getByText } = renderCard();
    expect(getByText('Strength Score')).toBeTruthy();
    expect(getByText('Strength ability score.')).toBeTruthy();
    expect(getByText('16')).toBeTruthy();
    expect(container.querySelector('[data-mock="Icon"]')).toBeTruthy();
  });

  it('treats a press-release without movement as a tap → onAdd', () => {
    let added: string | null = null;
    const { container } = renderCard((k) => (added = k));
    const card = container.querySelector('[data-mock="Container"]') as HTMLElement;
    press(card, 'pointerdown', 10, 10);
    press(card, 'pointerup', 10, 10);
    expect(added).toBe('str');
  });

  it('does not add when the pointer moved past the tap threshold (a drag)', () => {
    let added: string | null = null;
    const { container } = renderCard((k) => (added = k));
    const card = container.querySelector('[data-mock="Container"]') as HTMLElement;
    press(card, 'pointerdown', 10, 10);
    press(card, 'pointerup', 80, 80);
    expect(added).toBeNull();
  });
});
