import type { Component } from 'solid-js'
import { Show, createSignal, createEffect } from 'solid-js'
import { Button, Container, addSnackbar } from 'coles-solid-library'

interface ReloadPromptProps {
  needRefresh?: boolean;
  offlineReady?: boolean;
  updateServiceWorker?: (reloadPage?: boolean) => Promise<void>;
  version?: string;
}

/**
 * Surfaces service-worker lifecycle notifications using the design system instead of a bespoke
 * light-mode toast:
 *  - "cached for offline" is informational → fired once via the shared Snackbar (themed,
 *    auto-dismissing; SnackbarController is mounted in rootApp).
 *  - "new version available" needs a user action → a small themed Container with a Reload button,
 *    so the user chooses when to reload (prompt-to-reload; see register.ts). It's a polite live
 *    region, not a role="dialog", since it neither traps focus nor blocks the page.
 */
const ReloadPrompt: Component<ReloadPromptProps> = (props) => {
  const needRefresh = () => props.needRefresh || false;
  const offlineReady = () => props.offlineReady || false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const version = () => props.version || (import.meta as any).env?.VITE_APP_VERSION || 'dev';
  const updateServiceWorker = props.updateServiceWorker || (() => Promise.resolve());

  const [dismissed, setDismissed] = createSignal(false);

  // Announce "cached for offline" once via the shared Snackbar.
  let offlineNotified = false;
  createEffect(() => {
    if (offlineReady() && !offlineNotified) {
      offlineNotified = true;
      addSnackbar({ message: `App cached for offline use (v${version()}).`, severity: 'success' });
    }
  });

  const showUpdate = () => needRefresh() && !dismissed();

  return (
    <Show when={showUpdate()}>
      <Container
        theme="surface"
        role="status"
        aria-live="polite"
        aria-label="Application update available"
        style={{
          position: 'fixed', right: 'var(--spacing-3)', bottom: 'var(--spacing-3)', 'z-index': 1000,
          display: 'flex', 'align-items': 'center', 'flex-wrap': 'wrap', gap: 'var(--spacing-2)',
          padding: 'var(--spacing-2) var(--spacing-3)', 'border-radius': '8px',
          'box-shadow': 'var(--shadow-elevation-3)', 'max-width': 'min(90vw, 360px)',
        }}
      >
        <span>New version available (v{version()}). Reload to update.</span>
        <Button theme="primary" onClick={() => updateServiceWorker(true)} aria-label="Reload to apply update">Reload</Button>
        <Button transparent onClick={() => setDismissed(true)} aria-label="Dismiss update notification">Close</Button>
      </Container>
    </Show>
  )
}

export default ReloadPrompt
