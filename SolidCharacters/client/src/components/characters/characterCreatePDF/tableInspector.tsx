import { Component, Show, createMemo } from 'solid-js';
import { Button, Icon, Input } from 'coles-solid-library';
import { KeyboardArrowDown, KeyboardArrowLeft, KeyboardArrowRight, KeyboardArrowUp } from 'coles-solid-library/icons';
import {
  AnyTableConfig,
  AttackColsPatch,
  PDF_PAGE_H,
  PDF_PAGE_W,
  SheetTemplate,
  SpellColsPatch,
  SpellTextCol,
  clamp,
  mappingStore,
  toNum,
} from '../../../shared/sheetMapping';
import { COL_LABELS, MARKER_FULL_LABELS, TableSelection } from './tableGuidesOverlay';
import styles from './characterCreatePDF.module.scss';

interface TableInspectorProps {
  selectedTable: () => TableSelection | null;
  template: () => SheetTemplate;
  templateId: string;
}

type MarkerKey = 'concentration' | 'ritual' | 'material';

/**
 * Docked editor for the selected spell/attack table guide (sibling of
 * `FieldInspector`). Edits the persisted table geometry through
 * `mappingStore.updateSpellTable` / `updateAttackCantripTable` — column x/width,
 * marker center x, and the always-visible whole-table vertical position & row
 * height. Persistence rides the toolbar's Save (Reset restores defaults).
 */
export const TableInspector: Component<TableInspectorProps> = (props) => {
  const sel = () => props.selectedTable();
  const cfg = createMemo<AnyTableConfig | undefined>(() => {
    const s = sel();
    if (!s) return undefined;
    return s.table === 'spell' ? props.template().spellTable : props.template().attackCantripTable;
  });
  const isSpell = () => sel()?.table === 'spell';

  // ── geometry writers (idempotent in the store) ──
  const updateGeom = (patch: { firstRowTopFromTop?: number; rowPitch?: number }) => {
    if (isSpell()) mappingStore.updateSpellTable(props.templateId, patch);
    else mappingStore.updateAttackCantripTable(props.templateId, patch);
  };
  const updateCol = (col: string, colPatch: Partial<SpellTextCol>) => {
    if (isSpell()) mappingStore.updateSpellTable(props.templateId, { cols: { [col]: colPatch } as SpellColsPatch });
    else mappingStore.updateAttackCantripTable(props.templateId, { cols: { [col]: colPatch } as AttackColsPatch });
  };
  const updateMarker = (marker: MarkerKey, x: number) => {
    mappingStore.updateSpellTable(props.templateId, { markers: { [marker]: { x } } });
  };

  // ── selected-part accessors ──
  const colKey = () => (sel()?.part.kind === 'col' ? (sel()!.part as { key: string }).key : null);
  const markerKey = () => (sel()?.part.kind === 'marker' ? ((sel()!.part as { key: string }).key as MarkerKey) : null);
  const colData = (): SpellTextCol | null => {
    const c = cfg();
    const k = colKey();
    return c && k ? (c.cols as Record<string, SpellTextCol>)[k] ?? null : null;
  };
  const markerX = (): number | null => {
    const c = cfg();
    const k = markerKey();
    return c && k && 'markers' in c ? c.markers[k].x : null;
  };

  const title = () => {
    const s = sel();
    if (!s) return '';
    if (s.part.kind === 'col') return `${COL_LABELS[(s.part as { key: string }).key] ?? (s.part as { key: string }).key} column`;
    if (s.part.kind === 'marker') return `${MARKER_FULL_LABELS[(s.part as { key: string }).key] ?? ''} marker`;
    return 'Table position';
  };

  const nudge = (cur: number, step: number, lo: number, hi: number) => clamp(cur + step, lo, hi);

  return (
    <Show
      when={cfg()}
      fallback={<div class={styles.inspectorEmpty}>Select a spell-table column, marker, or the table move-bar.</div>}
    >
      {(config) => (
        <div class={styles.inspector}>
          <div class={styles.inspectorTitle}>{title()}</div>

          {/* Column: x + width, with a left/right nudge on x. */}
          <Show when={colData()}>
            {(c) => (
              <>
                <div class={styles.nudgeRow}>
                  <span>Move column</span>
                  <div class={styles.nudgePadRow}>
                    <Button
                      transparent
                      onClick={(e) => updateCol(colKey()!, { x: nudge(c().x, e.shiftKey ? -10 : -1, 0, PDF_PAGE_W) })}
                      title="Move left (Shift = 10pt)"
                    >
                      <Icon icon={KeyboardArrowLeft} />
                    </Button>
                    <Button
                      transparent
                      onClick={(e) => updateCol(colKey()!, { x: nudge(c().x, e.shiftKey ? 10 : 1, 0, PDF_PAGE_W) })}
                      title="Move right (Shift = 10pt)"
                    >
                      <Icon icon={KeyboardArrowRight} />
                    </Button>
                  </div>
                </div>
                <div class={styles.configGrid}>
                  <label>
                    X (pt)
                    <Input
                      type="number"
                      value={c().x}
                      onChange={(e) => updateCol(colKey()!, { x: clamp(toNum(e.currentTarget.value, c().x), 0, PDF_PAGE_W) })}
                    />
                  </label>
                  <label>
                    Width (pt)
                    <Input
                      type="number"
                      value={c().maxWidth}
                      onChange={(e) => updateCol(colKey()!, { maxWidth: clamp(toNum(e.currentTarget.value, c().maxWidth), 4, PDF_PAGE_W) })}
                    />
                  </label>
                </div>
              </>
            )}
          </Show>

          {/* Marker: center x, with a left/right nudge. */}
          <Show when={markerX() != null}>
            <div class={styles.nudgeRow}>
              <span>Move marker</span>
              <div class={styles.nudgePadRow}>
                <Button
                  transparent
                  onClick={(e) => updateMarker(markerKey()!, nudge(markerX()!, e.shiftKey ? -10 : -1, 0, PDF_PAGE_W))}
                  title="Move left (Shift = 10pt)"
                >
                  <Icon icon={KeyboardArrowLeft} />
                </Button>
                <Button
                  transparent
                  onClick={(e) => updateMarker(markerKey()!, nudge(markerX()!, e.shiftKey ? 10 : 1, 0, PDF_PAGE_W))}
                  title="Move right (Shift = 10pt)"
                >
                  <Icon icon={KeyboardArrowRight} />
                </Button>
              </div>
            </div>
            <div class={styles.configGrid}>
              <label>
                Center X (pt)
                <Input
                  type="number"
                  value={markerX() ?? 0}
                  onChange={(e) => updateMarker(markerKey()!, clamp(toNum(e.currentTarget.value, markerX() ?? 0), 0, PDF_PAGE_W))}
                />
              </label>
            </div>
          </Show>

          {/* Whole-table geometry: always available so the user can tune position/spacing. */}
          <div class={styles.inspectorSubhead}>Table position &amp; spacing</div>
          <div class={styles.nudgeRow}>
            <span>Move table</span>
            <div class={styles.nudgePadRow}>
              <Button
                transparent
                onClick={(e) => updateGeom({ firstRowTopFromTop: nudge(config().firstRowTopFromTop, e.shiftKey ? -10 : -1, 0, PDF_PAGE_H) })}
                title="Move up (Shift = 10pt)"
              >
                <Icon icon={KeyboardArrowUp} />
              </Button>
              <Button
                transparent
                onClick={(e) => updateGeom({ firstRowTopFromTop: nudge(config().firstRowTopFromTop, e.shiftKey ? 10 : 1, 0, PDF_PAGE_H) })}
                title="Move down (Shift = 10pt)"
              >
                <Icon icon={KeyboardArrowDown} />
              </Button>
            </div>
          </div>
          <div class={styles.configGrid}>
            <label>
              Vertical position (pt from top)
              <Input
                type="number"
                value={config().firstRowTopFromTop}
                onChange={(e) =>
                  updateGeom({ firstRowTopFromTop: clamp(toNum(e.currentTarget.value, config().firstRowTopFromTop), 0, PDF_PAGE_H) })
                }
              />
            </label>
            <label>
              Row height (pt)
              <Input
                type="number"
                value={config().rowPitch}
                onChange={(e) => updateGeom({ rowPitch: clamp(toNum(e.currentTarget.value, config().rowPitch), 1, 100) })}
              />
            </label>
          </div>
        </div>
      )}
    </Show>
  );
};
