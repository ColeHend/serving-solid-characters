import { createSignal } from "solid-js";

/**
 * Persistent-storage helper. By default a browser keeps a site's IndexedDB + Cache Storage in
 * the "best-effort" bucket, which Chrome silently evicts under storage pressure — so an installed
 * PWA can lose its offline data even after a successful download. Requesting persistence moves the
 * origin to the durable bucket (Firefox grants this readily for installed/engaged sites; Chrome
 * grants it by heuristic, which is why offline was unreliable there). See verifyOfflineReady.ts /
 * preloadSrd.ts for how this plugs into the offline-readiness flow.
 */

/** Tri-state: undefined = not yet checked / unsupported, else the last known persisted() result. */
export const [isPersisted, setIsPersisted] = createSignal<boolean | undefined>(undefined);

export interface StorageEstimateInfo {
  usage: number;
  quota: number;
  /** usage/quota * 100, rounded to one decimal; 0 when quota is unknown. */
  percent: number;
  supported: boolean;
}

function storageApi(): StorageManager | undefined {
  if (typeof navigator === "undefined") return undefined;
  return navigator.storage;
}

/**
 * Read the current persisted() state WITHOUT prompting (cheap, safe on startup and for the
 * status panel). Returns undefined when the API is unsupported. Updates the isPersisted signal.
 */
export async function checkPersisted(): Promise<boolean | undefined> {
  const api = storageApi();
  if (!api?.persisted) {
    setIsPersisted(undefined);
    return undefined;
  }
  try {
    const persisted = await api.persisted();
    setIsPersisted(persisted);
    return persisted;
  } catch (e) {
    console.warn("[persist] persisted() failed", e);
    setIsPersisted(undefined);
    return undefined;
  }
}

/**
 * Ask the browser to make this origin's storage durable. Checks persisted() first (so it's
 * idempotent and avoids re-prompting), then calls persist(). Returns false when unsupported or
 * denied. Updates the isPersisted signal. Best called from a user gesture (install / download
 * click), when Chrome is most likely to grant.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const api = storageApi();
  if (!api?.persist) {
    setIsPersisted(undefined);
    return false;
  }
  try {
    if (api.persisted && (await api.persisted())) {
      setIsPersisted(true);
      return true;
    }
    const granted = await api.persist();
    setIsPersisted(granted);
    return granted;
  } catch (e) {
    console.warn("[persist] persist() failed", e);
    return false;
  }
}

/** navigator.storage.estimate() wrapped with a usage percentage and an unsupported flag. */
export async function getStorageEstimate(): Promise<StorageEstimateInfo> {
  const api = storageApi();
  if (!api?.estimate) return { usage: 0, quota: 0, percent: 0, supported: false };
  try {
    const { usage = 0, quota = 0 } = await api.estimate();
    const percent = quota > 0 ? Math.round((usage / quota) * 1000) / 10 : 0;
    return { usage, quota, percent, supported: true };
  } catch (e) {
    console.warn("[persist] estimate() failed", e);
    return { usage: 0, quota: 0, percent: 0, supported: false };
  }
}
