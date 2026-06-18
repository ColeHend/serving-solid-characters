import { Component, Show, createEffect, createSignal, onCleanup } from 'solid-js';
import { Container } from 'coles-solid-library';
import { SheetTemplate } from '../../../shared/sheetMapping';
import { FeatureDetail } from '../../../models/generated';
import { generateSheetPdf } from '../../../shared/sheetMapping/pdf/generateSheetPdf';
import { SpellRow } from '../../../shared/sheetMapping/pdf/spellTable';
import styles from './characterCreatePDF.module.scss';

interface SheetPreviewProps {
  /** Current character → sheet values (owned by the shell). */
  values: () => Record<string, string>;
  template: () => SheetTemplate;
  activePage: () => number;
  /** Sorted spell rows for the page-2 table (owned by the shell). */
  spells?: () => SpellRow[];
  /** Structured feature lists for `featureList` placements (owned by the shell). */
  featureLists?: () => Record<string, FeatureDetail[]>;
}

const DEBOUNCE_MS = 250;

/**
 * WYSIWYG source of truth: renders the ACTUAL generated PDF bytes (same
 * `generateSheetPdf` the download button uses) into an `<iframe>` via a blob
 * object URL. Regen is debounced; a monotonic token discards stale results;
 * the prior object URL is revoked on each swap and on cleanup; the pending timer
 * is cancelled on cleanup so nothing regenerates after unmount.
 */
export const SheetPreview: Component<SheetPreviewProps> = (props) => {
  const [src, setSrc] = createSignal<string>('');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let currentUrl: string | undefined;
  let token = 0;

  createEffect(() => {
    // Capture tracked inputs synchronously (before the debounce) so the effect
    // re-subscribes on every change to values / template / active page.
    const values = props.values();
    const template = props.template();
    const spells = props.spells?.() ?? [];
    const featureLists = props.featureLists?.() ?? {};
    void props.activePage();

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const myToken = ++token;
      void generateSheetPdf(values, template, spells, featureLists)
        .then((bytes) => {
          if (myToken !== token) return; // a newer regen superseded this one
          const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
          if (currentUrl) URL.revokeObjectURL(currentUrl);
          currentUrl = url;
          setSrc(url);
        })
        .catch(() => {
          /* keep the last good preview on failure */
        });
    }, DEBOUNCE_MS);
  });

  onCleanup(() => {
    if (timer) clearTimeout(timer);
    token++; // invalidate any in-flight regen
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = undefined;
  });

  return (
    <Container theme="surface" class={styles.previewPane}>
      <Show when={src()} fallback={<div class={styles.previewPlaceholder}>Generating preview…</div>}>
        <iframe class={styles.previewFrame} src={src()} title="Sheet preview" />
      </Show>
    </Container>
  );
};
