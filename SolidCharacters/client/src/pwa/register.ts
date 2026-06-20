import { createSignal } from 'solid-js';

export const [needRefresh, setNeedRefresh] = createSignal(false);
export const [offlineReady, setOfflineReady] = createSignal(false);
export const [swVersion, setSwVersion] = createSignal<string | undefined>();
export const [swBuildTime, setSwBuildTime] = createSignal<string | undefined>();
export const [logs, setLogs] = createSignal<string[]>([]);

let updateFn: (reloadPage?: boolean) => Promise<void> = () => Promise.resolve();

function log(msg: string) {
  setLogs(l => [...l.slice(-199), msg]);
  console.log(msg);
}

// One-time reload when a new SW takes control, so the page is served by a single
// consistent version (and its complete precache) instead of a stale/active mix.
let reloadingForUpdate = false;
function reloadOnce() {
  if (reloadingForUpdate) return;
  reloadingForUpdate = true;
  window.location.reload();
}

/**
 * Registers the service worker via vite-plugin-pwa's single virtual module. Auto-update
 * flow (registerType: 'autoUpdate'): when a new SW is waiting we apply it immediately
 * (skipWaiting → controllerchange → reload), so the corrected SW always controls the page.
 * This is what fixes the installed/offline "stale SW can't serve new chunks" breakage.
 * No manual fallback registration — one code path.
 */
export function registerServiceWorker() {
  // Dev has no precache manifest; a stale prod SW would starve page loads.
  if (!import.meta.env.PROD) {
    log('[sw-reg] skipped (dev)');
    return;
  }
  if (!('serviceWorker' in navigator)) {
    log('[sw-reg] serviceWorker not supported');
    return;
  }

  navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);

  import('virtual:pwa-register/solid').then(({ useRegisterSW }) => {
    const { updateServiceWorker } = useRegisterSW({
      immediate: true,
      onRegisteredSW(url) {
        log(`[sw-reg] registered ${url}`);
      },
      onRegisterError(e) {
        log('[sw-reg] register error ' + e);
      },
      onNeedRefresh() {
        // Auto-apply: skipWaiting the new SW; the controllerchange handler reloads.
        log('[sw-reg] update available -> auto-applying');
        setNeedRefresh(true);
        updateServiceWorker(true).catch(e => log('[sw-reg] auto-update failed ' + e));
      },
      onOfflineReady() {
        log('[sw-reg] offline ready');
        setOfflineReady(true);
      },
    });
    updateFn = updateServiceWorker;
    attachMessaging();
  }).catch(err => {
    log('[sw-reg] registration failed ' + err);
  });
}

function attachMessaging() {
  if ((attachMessaging as any)._attached) return;
  (attachMessaging as any)._attached = true;
  navigator.serviceWorker.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === 'SW_ACTIVATED') {
      if (d.version) setSwVersion(d.version);
      if (d.buildTime) setSwBuildTime(d.buildTime);
      setOfflineReady(true);
      log(`[sw-msg] activated v=${d.version}`);
    } else if (d.type === 'PONG' && d.version) {
      setSwVersion(d.version);
    }
  });
  navigator.serviceWorker.ready.then(reg => {
    reg.active?.postMessage({ type: 'PING' });
  });
}

/**
 * Apply a waiting update and reload. updateServiceWorker(true) messages the waiting SW to
 * skipWaiting and reloads the page on controllerchange — the standard prompt flow.
 */
export async function applyUpdateAndReload() {
  await updateFn(true);
}

export function dismissOfflineToast() {
  setOfflineReady(false);
  setNeedRefresh(false);
}
