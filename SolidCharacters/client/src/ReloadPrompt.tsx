import type { Component } from 'solid-js'
import { Show, createSignal, createEffect } from 'solid-js'
import styles from './ReloadPrompt.module.css'

interface ReloadPromptProps {
  needRefresh?: boolean;
  offlineReady?: boolean;
  updateServiceWorker?: (reloadPage?: boolean) => Promise<void>;
  version?: string;
}

const ReloadPrompt: Component<ReloadPromptProps> = (props) => {
  const [visible, setVisible] = createSignal(false);
  const needRefresh = () => props.needRefresh || false;
  const offlineReady = () => props.offlineReady || false;
  const version = () => props.version || (import.meta as any).env?.VITE_APP_VERSION || 'dev';
  
  // If no updateServiceWorker provided, create a dummy function
  const updateServiceWorker = props.updateServiceWorker || (() => Promise.resolve());

  createEffect(() => {
    if (needRefresh() || offlineReady()) setVisible(true);
  });

  const close = () => setVisible(false);

  return (
    <div class={styles.Container} role="status" aria-live="polite">
      <Show when={(offlineReady() || needRefresh()) && visible()}>
        <div class={styles.Toast} role="dialog" aria-label="Application update notification">
          <div class={styles.Message}>
            <Show when={needRefresh()}>
              <span>New version available (v{version()}). Reload to update.</span>
            </Show>
            <Show when={!needRefresh() && offlineReady()}>
              <span>App cached for offline use (v{version()}).</span>
            </Show>
          </div>
          <div style={{display:'flex','gap':'0.5rem'}}>
            <Show when={needRefresh()}>
              <button class={styles.ToastButton} onClick={() => updateServiceWorker(true)} aria-label="Reload to apply update">Reload</button>
            </Show>
            <button class={styles.ToastButton} onClick={() => close()} aria-label="Dismiss update notification">Close</button>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default ReloadPrompt