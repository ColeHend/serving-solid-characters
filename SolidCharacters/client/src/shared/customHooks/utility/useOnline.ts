import { createSignal, onCleanup } from "solid-js";

/**
 * Reactive online/offline status. Returns an accessor tracking navigator.onLine via the window
 * 'online'/'offline' events, so the UI can show an offline indicator and explain why data may be
 * cached/stale. SSR-safe: defaults to online when there's no window/navigator.
 */
export function useOnline() {
  const initial = typeof navigator === "undefined" ? true : navigator.onLine;
  const [online, setOnline] = createSignal(initial);

  if (typeof window !== "undefined") {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    onCleanup(() => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    });
  }

  return online;
}

export default useOnline;
