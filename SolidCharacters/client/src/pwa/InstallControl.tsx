import { Component, Show, createEffect, createMemo } from "solid-js";
import { Button, addSnackbar } from "coles-solid-library";
import { canInstall, isInstalled, promptInstall } from "./install";
import { preloadActive, preloadComplete, preloadProgress, preloadResult, runOfflinePreload } from "./offline/preloadSrd";

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

  // Announce the outcome of each download run exactly once. Success only when everything
  // downloaded; otherwise a warning — so an offline run never falsely claims "available offline".
  let notified = false;
  createEffect(() => {
    if (preloadActive()) { notified = false; return; }
    const res = preloadResult();
    if (!res || notified) return;
    notified = true;
    if (res.failed === 0) {
      addSnackbar({ message: 'All data downloaded — available offline.', severity: 'success' });
    } else {
      addSnackbar({
        message: `Downloaded ${res.succeeded}/${res.total} datasets — some need a connection. Try again when online.`,
        severity: 'warning',
      });
    }
  });

  // After a failed/partial run the data isn't fully cached, so offer a retry instead of hiding it.
  const lastRunFailed = () => (preloadResult()?.failed ?? 0) > 0;

  const onInstall = async () => {
    const outcome = await promptInstall();
    // No native prompt available (already installed / iOS) — just pull the data.
    if (outcome === 'unavailable') void runOfflinePreload(['2014', '2024']);
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
        <Button transparent title="Download all SRD data (spells, classes, races…) for offline use" onClick={() => runOfflinePreload(['2014', '2024'])}>
          {lastRunFailed() ? 'Retry offline download' : 'Download offline data'}
        </Button>
      </Show>
    </div>
  );
};

export default InstallControl;
