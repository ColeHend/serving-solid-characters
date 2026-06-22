import { Component, Show, createEffect, createMemo } from "solid-js";
import { Button, addSnackbar } from "coles-solid-library";
import { canInstall, isInstalled, promptInstall } from "./install";
import { preloadActive, preloadComplete, preloadProgress, preloadResult, offlineReport, runOfflinePreload } from "./offline/preloadSrd";
import { requestPersistentStorage } from "./offline/persistentStorage";
import OfflineStatus from "./OfflineStatus";

/**
 * Renders the "Install this Site" button and offline-data download progress. The install
 * action both adds the PWA and pulls all SRD data for offline use; a manual "Download
 * offline data" button covers already-installed and non-promptable (iOS) browsers.
 */
const InstallControl: Component = () => {
  const pct = createMemo(() => {
    const { done, total } = preloadProgress();
    return total ? Math.round((done / total) * 100) : 0;
  });

  // Announce the outcome of each download run exactly once. "Available offline" only when the run
  // is VERIFIED ready (data in IndexedDB + shell precached + SW controlling) — so an offline run, a
  // still-precaching SW, or evicted storage never falsely claims "available offline".
  let notified = false;
  createEffect(() => {
    if (preloadActive()) { notified = false; return; }
    const res = preloadResult();
    if (!res || notified) return;
    notified = true;
    if (preloadComplete()) {
      addSnackbar({ message: 'All data downloaded — available offline.', severity: 'success' });
    } else if (res.failed === 0) {
      // Fetches succeeded but readiness couldn't be confirmed. List every failing gate (app shell,
      // service worker, datasets) so the message is actionable, then invite a retry.
      const r = offlineReport();
      const reasons: string[] = [];
      if (r && !r.precache.ok) reasons.push('app shell not cached');
      if (r && (!r.serviceWorker.controlling || !r.serviceWorker.activated)) reasons.push('service worker not active');
      if (r && r.data.missing.length) {
        reasons.push(`missing ${r.data.missing.slice(0, 3).join(', ')}${r.data.missing.length > 3 ? '…' : ''}`);
      }
      const detail = reasons.length ? ` (${reasons.join('; ')})` : '';
      addSnackbar({
        message: `Downloaded, but offline readiness couldn't be confirmed${detail} — reopen the app and try again.`,
        severity: 'warning',
      });
    } else {
      addSnackbar({
        message: `Downloaded ${res.succeeded}/${res.total} datasets — some need a connection. Try again when online.`,
        severity: 'warning',
      });
    }
  });

  // After a failed/partial run the data isn't fully cached, so offer a retry instead of hiding it.
  const lastRunFailed = () => (preloadResult()?.failed ?? 0) > 0;

  // Request durable storage on the explicit user gesture (best chance of a grant). Surface a
  // low-key notice if the browser declines, so the user understands data may be cleared later.
  const ensurePersistence = async () => {
    const granted = await requestPersistentStorage();
    if (!granted) {
      addSnackbar({
        severity: 'info',
        message: 'Offline data saved, but your browser may clear it under storage pressure. Keeping the app installed helps make storage permanent.',
      });
    }
  };

  const onDownload = async () => {
    await ensurePersistence();
    void runOfflinePreload(['2014', '2024']);
  };

  const onInstall = async () => {
    const outcome = await promptInstall();
    // No native prompt available (already installed / iOS) — request persistence + pull the data.
    if (outcome === 'unavailable') await onDownload();
  };

  return (
    <div style={{ display: 'flex', 'align-items': 'center', gap: 'var(--spacing-2)' }}>
      <Show when={preloadActive()}>
        <span role="status" aria-live="polite" style={{ 'font-size': 'var(--font-size-small)', opacity: 0.85 }}>
          Downloading offline data… {preloadProgress().done}/{preloadProgress().total} ({pct()}%)
        </span>
      </Show>

      <Show when={!preloadActive() && canInstall() && !isInstalled()}>
        <Button onClick={onInstall}>Install this Site</Button>
      </Show>

      <Show when={!preloadActive() && !preloadComplete() && (isInstalled() || !canInstall())}>
        <Button transparent title="Download all SRD data (spells, classes, races…) for offline use" onClick={onDownload}>
          {lastRunFailed() ? 'Retry offline download' : 'Download offline data'}
        </Button>
      </Show>

      <OfflineStatus />
    </div>
  );
};

export default InstallControl;
