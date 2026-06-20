import { createSignal } from "solid-js";
import { runOfflinePreload } from "./offline/preloadSrd";

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

  // Already installed (e.g. launched from the home screen, or installed via browser UI):
  // top up the offline data in the background so nothing is missing.
  if (detectStandalone() && navigator.onLine) {
    void runOfflinePreload(['2014', '2024']);
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
    // Pull the full site data now that the user has installed the PWA.
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
    // appinstalled will usually also fire, but trigger here too so the download starts
    // promptly even on browsers that delay/skip that event.
    void runOfflinePreload(['2014', '2024']);
  }
  return outcome;
}
