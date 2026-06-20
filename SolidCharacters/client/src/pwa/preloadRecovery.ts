/**
 * Auto-heals lazy chunk / CSS preload failures. These happen during a service-worker
 * version transition: a stale active SW serves a fresh index.html but can't serve the new
 * chunk URLs from its precache, so Vite's __vitePreload rejects with "Unable to preload
 * CSS for /assets/…". Recovery: activate any waiting SW (it has the complete current
 * precache), then reload to a single consistent version. A sessionStorage counter prevents
 * reload loops if the failure is genuinely unrecoverable (e.g. truly offline + no precache).
 */

const RELOAD_KEY = 'pwa-preload-reloads';
const MAX_RELOADS = 2;
const WINDOW_MS = 30_000;

interface ReloadState { n: number; t: number }

function readState(): ReloadState {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(RELOAD_KEY) || 'null');
    if (parsed && typeof parsed.n === 'number' && typeof parsed.t === 'number') return parsed;
  } catch { /* ignore */ }
  return { n: 0, t: 0 };
}

/** Activate a waiting SW (if any) and reload once. No-op past the loop-guard budget. */
export function recoverFromChunkError() {
  const now = Date.now();
  let state = readState();
  if (now - state.t > WINDOW_MS) state = { n: 0, t: now };
  if (state.n >= MAX_RELOADS) {
    console.error('[pwa] chunk preload still failing after reloads; leaving the page as-is');
    return;
  }
  state = { n: state.n + 1, t: now };
  try { sessionStorage.setItem(RELOAD_KEY, JSON.stringify(state)); } catch { /* ignore */ }

  const reload = () => window.location.reload();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration()
      .then(reg => { reg?.waiting?.postMessage({ type: 'SKIP_WAITING' }); })
      .catch(() => { /* ignore */ })
      // Give a waiting SW a moment to take control (its controllerchange also reloads);
      // otherwise this reload re-fetches a consistent set from the network.
      .finally(() => setTimeout(reload, 200));
  } else {
    reload();
  }
}

/** Wire up Vite's preload-error event. Call once at startup. */
export function initPreloadRecovery() {
  if (typeof window === 'undefined') return;
  window.addEventListener('vite:preloadError', (event: Event) => {
    // Prevent Vite from throwing the error as unhandled; we recover by reloading.
    event.preventDefault();
    console.warn('[pwa] vite:preloadError — recovering via SW update + reload');
    recoverFromChunkError();
  });
}
