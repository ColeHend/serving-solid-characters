import { Component, JSX, Show, createSignal, onMount } from "solid-js";
import { Button, Container, Icon } from "coles-solid-library";
import { CloudDone, CloudOff, CloudSync, Check, Close, Refresh } from "coles-solid-library/icons";
import useClickOutside from "solid-click-outside";
import { offlineReport, refreshOfflineReadiness } from "./offline/preloadSrd";
import { isPersisted, checkPersisted, getStorageEstimate, type StorageEstimateInfo } from "./offline/persistentStorage";

/**
 * Compact offline-readiness indicator for the subheader. Shows at a glance whether the app is
 * cached for offline use, and on click reveals exactly what's cached (persisted storage, storage
 * usage, service-worker control, app shell, each SRD dataset, OCR) — so "it doesn't seem to be
 * caching everything" becomes something the user can actually see and re-check. Reads the verified
 * report from the last download (offlineReport) and refreshes it on demand.
 */

const fmtMB = (bytes: number) => `${(bytes / 1048576).toFixed(bytes < 10 * 1048576 ? 1 : 0)} MB`;

const OfflineStatus: Component = () => {
  const [open, setOpen] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [estimate, setEstimate] = createSignal<StorageEstimateInfo | undefined>();
  // One ref on the wrapper (chip + panel live inside it), so clicking either is "inside".
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();

  useClickOutside(rootRef, () => setOpen(false));

  const refresh = async () => {
    setBusy(true);
    try {
      // refreshOfflineReadiness updates both offlineReport AND preloadComplete (so the download
      // button hides when genuinely ready), then we refresh the storage estimate + persisted state.
      const [, est] = await Promise.all([
        refreshOfflineReadiness(['2014', '2024']),
        getStorageEstimate(),
        checkPersisted(),
      ]);
      setEstimate(est);
    } finally {
      setBusy(false);
    }
  };

  // Populate on mount so the panel reflects what's already cached, even before any download click.
  onMount(() => { void refresh(); });

  const report = offlineReport;
  const ready = () => report()?.ready === true;

  const chipIcon = () => {
    if (busy() && !report()) return CloudSync;
    const r = report();
    if (!r) return CloudSync;
    return r.ready ? CloudDone : CloudOff;
  };
  const chipColor = () => {
    const r = report();
    if (!r) return 'var(--on-surface-color)';
    return r.ready ? 'green' : 'orange';
  };
  const chipTitle = () =>
    !report() ? 'Checking offline readiness…' : ready() ? 'Ready for offline use' : 'Not fully cached for offline use';

  const Line = (p: { label: string; value: JSX.Element; ok?: boolean }) => (
    <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', gap: 'var(--spacing-3)' }}>
      <span style={{ opacity: 0.85 }}>{p.label}</span>
      <span style={{ display: 'flex', 'align-items': 'center', gap: 'var(--spacing-1)' }}>
        {p.value}
        <Show when={p.ok !== undefined}>
          <Icon icon={p.ok ? Check : Close} size="small" color={p.ok ? 'green' : 'red'} />
        </Show>
      </span>
    </div>
  );

  const persistedText = () => (isPersisted() === undefined ? 'Unknown' : isPersisted() ? 'Yes (permanent)' : 'No (may be cleared)');

  return (
    <div ref={setRootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <div
        role="button"
        tabindex={0}
        title={chipTitle()}
        aria-label={chipTitle()}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
        style={{ display: 'inline-flex', 'align-items': 'center', cursor: 'pointer', padding: 'var(--spacing-1)' }}
      >
        <Icon icon={chipIcon()} color={chipColor()} size="small" />
      </div>

      <Show when={open()}>
        <Container
          theme="surface"
          style={{
            position: 'absolute',
            top: 'calc(100% + var(--spacing-1))',
            right: '0',
            'z-index': '1000',
            'min-width': '260px',
            padding: 'var(--spacing-2)',
            'border-radius': 'var(--spacing-1)',
            'box-shadow': 'var(--shadow-elevation-3)',
            display: 'flex',
            'flex-direction': 'column',
            gap: 'var(--spacing-1)',
            'font-size': 'var(--font-size-small)',
          }}
        >
          <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-bottom': 'var(--spacing-1)' }}>
            <strong>{ready() ? 'Available offline' : 'Offline status'}</strong>
            <Button transparent disabled={busy()} title="Re-check offline readiness" onClick={() => void refresh()}>
              <Icon icon={Refresh} size="small" /> {busy() ? 'Checking…' : 'Re-check'}
            </Button>
          </div>

          <Line label="Permanent storage" value={persistedText()} ok={isPersisted() === undefined ? undefined : isPersisted()} />

          <Show when={estimate()?.supported}>
            <Line
              label="Storage used"
              value={<span>{fmtMB(estimate()!.usage)} / {fmtMB(estimate()!.quota)} ({estimate()!.percent}%)</span>}
            />
          </Show>

          <Line label="Service worker" value={report()?.serviceWorker.controlling ? 'Active' : 'Not controlling'} ok={!!report()?.serviceWorker.controlling} />

          <Line
            label="App shell"
            value={report()?.precache.ok ? `Cached (${report()!.precache.entryCount} files)` : 'Not cached'}
            ok={!!report()?.precache.ok}
          />

          <Line
            label="Reference data"
            value={report() ? `${report()!.data.checks.filter((c) => c.ok).length}/${report()!.data.checks.length} datasets` : '—'}
            ok={report() ? report()!.data.ok : undefined}
          />

          <Show when={report() && report()!.data.missing.length > 0}>
            <div style={{ color: 'red', opacity: 0.9, 'padding-left': 'var(--spacing-1)' }}>
              Missing: {report()!.data.missing.join(', ')}
            </div>
          </Show>

          <Line
            label="Image-to-text (OCR)"
            value={report()?.ocr.ok ? 'Cached' : 'Online only'}
            ok={report() ? report()!.ocr.ok : undefined}
          />
        </Container>
      </Show>
    </div>
  );
};

export default OfflineStatus;
