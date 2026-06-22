import { createSignal } from "solid-js";
import { runOfflinePreload, clearOfflineDoneMarker, refreshOfflineReadiness, type SrdVersion } from "./offline/preloadSrd";
import { requestPersistentStorage, checkPersisted } from "./offline/persistentStorage";

/**
 * On startup (idle, so it doesn't compete with first paint): recompute offline readiness from the
 * REAL cache state and push it to the subheader for every visitor, and SELF-HEAL the installed app —
 * if data was evicted or a previous download never completed, re-download. Verifying the actual cache
 * (rather than trusting the "done" marker) is what catches Chrome evicting an un-persisted origin.
 * The manual "Download offline data" button bypasses this and always runs.
 */
function scheduleStartupReadinessCheck(versions: SrdVersion[]) {
  const run = async () => {
    const report = await refreshOfflineReadiness(versions);
    if (detectStandalone() && navigator.onLine && !report?.ready) {
      clearOfflineDoneMarker(); // evicted/incomplete — clear stale marker and re-download
      void runOfflinePreload(versions);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void, opts?: { timeout: number }) => void);
  if (ric) ric(() => void run(), { timeout: 3000 });
  else setTimeout(() => void run(), 1200);
}

// The `beforeinstallprompt` event isn't in the standard DOM lib types.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const [deferredPrompt, setDeferredPrompt] = createSignal<BeforeInstallPromptEvent | null>(null);

/** True when the browser has offered a native install prompt we can replay. */
export const [canInstall, setCanInstall] = createSignal(false);
/** True when the app is running as an installed PWA (standalone display mode). */
export const [isInstalled, setIsInstalled] = createSignal(false);

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)')?.matches
    || (navigator as any).standalone === true;
}

/**
 * Wire up the Add-to-Home-Screen lifecycle. Captures the install prompt so the app can
 * offer its own "Install this Site" button, and — once installed — pulls all offline data.
 * Call once at startup.
 */
export function initInstallFlow() {
  if (typeof window === 'undefined') return;

  setIsInstalled(detectStandalone());

  // Reflect the current persisted state in the status panel without prompting.
  void checkPersisted();

  // Reflect real offline readiness in the subheader for every visitor (idle), and self-heal the
  // installed app if its cached data was evicted.
  scheduleStartupReadinessCheck(['2014', '2024']);

  // Installed (launched from the home screen / installed via browser UI): make storage durable so
  // Chrome doesn't evict the un-persisted origin's IndexedDB + Cache Storage.
  if (detectStandalone() && navigator.onLine) {
    void requestPersistentStorage();
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault(); // suppress the mini-infobar; we drive the prompt ourselves
    setDeferredPrompt(e as BeforeInstallPromptEvent);
    setCanInstall(true);
  });

  window.addEventListener('appinstalled', () => {
    setIsInstalled(true);
    setCanInstall(false);
    setDeferredPrompt(null);
    // Make storage durable first (best chance of a grant right after install), then pull the full
    // site data now that the user has installed the PWA.
    void requestPersistentStorage();
    void runOfflinePreload(['2014', '2024']);
  });
}

/**
 * Replay the captured install prompt. Returns the user's choice, or 'unavailable' when
 * there's no native prompt to show (already installed, or a browser like iOS Safari that
 * doesn't fire beforeinstallprompt).
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const evt = deferredPrompt();
  if (!evt) return 'unavailable';
  await evt.prompt();
  const { outcome } = await evt.userChoice;
  setDeferredPrompt(null);
  setCanInstall(false);
  if (outcome === 'accepted') {
    // appinstalled will usually also fire, but trigger here too so persistence + download start
    // promptly even on browsers that delay/skip that event.
    void requestPersistentStorage();
    void runOfflinePreload(['2014', '2024']);
  }
  return outcome;
}
