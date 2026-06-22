import { describe, it, expect, afterEach } from 'vitest';
import { createSignal } from 'solid-js';
import { render, cleanup } from '@solidjs/testing-library';
import { PlacedField } from '../../../shared/sheetMapping';
import { FeatureBoxOutline } from './featureBoxOutline';

afterEach(cleanup);

const field = (over: Partial<PlacedField> = {}): PlacedField => ({
  fieldKey: 'classFeatures',
  pageIndex: 0,
  x: 100,
  y: 600,
  fontSize: 8,
  font: 'Helvetica',
  align: 'left',
  maxWidth: 240,
  renderMode: 'featureList',
  columns: 2,
  columnGap: 12,
  boxHeight: 150,
  ...over,
});

const boxOf = (c: HTMLElement) => c.querySelector('[aria-hidden="true"]') as HTMLElement;
const dividers = (box: HTMLElement) => Array.from(box.children) as HTMLElement[];

describe('FeatureBoxOutline', () => {
  it('positions the box at pdfToScreen(x, y) with maxWidth/boxHeight scaled by zoom', () => {
    const { container } = render(() => <FeatureBoxOutline field={field()} zoom={() => 2} />);
    const box = boxOf(container);
    // pdfToScreen(100, 600, 2) = { left: 200, top: (792-600)*2 = 384 }
    expect(box.style.left).toBe('200px');
    expect(box.style.top).toBe('384px');
    expect(box.style.width).toBe('480px'); // 240 * 2
    expect(box.style.height).toBe('300px'); // 150 * 2
  });

  it('draws columns-1 dividers, each centered in its column gap', () => {
    const { container } = render(() => <FeatureBoxOutline field={field()} zoom={() => 2} />);
    const divs = dividers(boxOf(container));
    expect(divs.length).toBe(1); // 2 columns → 1 divider
    // colW = (240 - 12) / 2 = 114; divider = (114 + 12/2) * 2 = 240
    expect(divs[0].style.left).toBe('240px');
  });

  it('renders no divider for a single-column box', () => {
    const { container } = render(() => <FeatureBoxOutline field={field({ columns: 1 })} zoom={() => 2} />);
    expect(dividers(boxOf(container)).length).toBe(0);
  });

  it('reactively adds a divider when columns 2 → 3', () => {
    const [f, setF] = createSignal(field());
    const { container } = render(() => <FeatureBoxOutline field={f()} zoom={() => 2} />);
    expect(dividers(boxOf(container)).length).toBe(1);
    setF(field({ columns: 3 }));
    const divs = dividers(boxOf(container));
    expect(divs.length).toBe(2);
    // colW = (240 - 24) / 3 = 72; dividers at (72+6)*2=156 and (144+12+6)*2=324
    expect(divs.map((d) => d.style.left)).toEqual(['156px', '324px']);
  });
});
