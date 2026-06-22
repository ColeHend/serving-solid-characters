import { createSignal } from 'solid-js';

export const [needRefresh, setNeedRefresh] = createSignal(false);
export const [offlineReady, setOfflineReady] = createSignal(false);
export const [swVersion, setSwVersion] = createSignal<string | undefined>();
export const [swBuildTime, setSwBuildTime] = createSignal<string | undefined>();
const [, setLogs] = createSignal<string[]>([]);

let updateFn: (reloadPage?: boolean) => Promise<void> = () => Promise.resolve();

function log(msg: string) {
  setLogs(l => [...l.slice(-199), msg]);
  console.log(msg);
}

// One-time reload when a new SW takes control of an already-controlled page, so the page is
// served by a single consistent version (and its complete precache) instead of a stale/active
// mix. The very first controllerchange (initial clientsClaim on a brand-new install) is NOT an
// update and is skipped below — otherwise a first-time visitor gets reloaded for no reason.
let reloadingForUpdate = false;
function reloadOnce() {
  if (reloadingForUpdate) return;
  reloadingForUpdate = true;
  window.location.reload();
}

/**
 * Registers the service worker via vite-plugin-pwa's single virtual module. Prompt-to-reload
 * flow: when a new SW is waiting (onNeedRefresh) we surface the ReloadPrompt toast and leave the
 * SW waiting; the user applies it via applyUpdateAndReload (skipWaiting → controllerchange →
 * one-time reload). This keeps the corrected SW (with the complete precache) available without
 * reloading the page out from under an in-progress edit. The vite:preloadError safety net
 * (preloadRecovery.ts) still auto-heals a chunk mismatch if the user stays on a stale SW.
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

  // Was the page already controlled by a SW when we registered? A controllerchange while this
  // is false is the initial clientsClaim of a first install (not an update), so don't reload then.
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) { hadController = true; return; }
    reloadOnce();
  });

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
        // Prompt-to-reload: keep the new SW waiting and surface the ReloadPrompt toast. The
        // user clicks "Reload" (-> applyUpdateAndReload -> updateServiceWorker(true)) when ready,
        // so an in-progress character edit is never discarded by a surprise reload.
        log('[sw-reg] update available -> prompting');
        setNeedRefresh(true);
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
