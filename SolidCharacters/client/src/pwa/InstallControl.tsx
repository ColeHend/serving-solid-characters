import { Component, Show, createEffect, createMemo } from "solid-js";
import { Button, addSnackbar } from "coles-solid-library";
import { canInstall, isInstalled, promptInstall } from "./install";
import { preloadActive, preloadComplete, preloadProgress, runOfflinePreload } from "./offline/preloadSrd";

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

  // Notify once when a download run finishes.
  let notified = false;
  createEffect(() => {
    if (preloadComplete() && !notified) {
      notified = true;
      addSnackbar({ message: 'All data downloaded — available offline.', severity: 'success' });
    }
    if (preloadActive()) notified = false;
  });

  const onInstall = async () => {
    const outcome = await promptInstall();
    // No native prompt available (already installed / iOS) — just pull the data.
    if (outcome === 'unavailable') void runOfflinePreload(['2014', '2024']);
  };

  return (
    <div style={{ display: 'flex', 'align-items': 'center', gap: '0.5rem' }}>
      <Show when={preloadActive()}>
        <span style={{ 'font-size': '0.85rem', opacity: 0.85 }}>
          Downloading offline data… {preloadProgress().done}/{preloadProgress().total} ({pct()}%)
        </span>
      </Show>

      <Show when={!preloadActive() && canInstall() && !isInstalled()}>
        <Button onClick={onInstall}>Install this Site</Button>
      </Show>

      <Show when={!preloadActive() && !preloadComplete() && (isInstalled() || !canInstall())}>
        <Button transparent onClick={() => runOfflinePreload(['2014', '2024'])}>Download offline data</Button>
      </Show>
    </div>
  );
};

export default InstallControl;
