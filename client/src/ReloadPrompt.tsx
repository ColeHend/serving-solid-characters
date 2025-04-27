import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import styles from './ReloadPrompt.module.css'

interface ReloadPromptProps {
  needRefresh?: boolean;
  offlineReady?: boolean;
  updateServiceWorker?: (reloadPage?: boolean) => Promise<void>;
}

const ReloadPrompt: Component<ReloadPromptProps> = (props) => {
  // Use props if provided, otherwise fallback to empty functions/values
  const needRefresh = () => props.needRefresh || false;
  const offlineReady = () => props.offlineReady || false;
  
  // If no updateServiceWorker provided, create a dummy function
  const updateServiceWorker = props.updateServiceWorker || (() => Promise.resolve());

  const close = () => {
    // Since we're now using props, we can't set the signals directly
    // This will be handled by the parent component
    console.log('Close clicked');
  }

  return (
    <div class={styles.Container}>
      <Show when={offlineReady() || needRefresh()}>
        <div class={styles.Toast}>
          <div class={styles.Message}>
            <Show
              fallback={<span>New content available, click on reload button to update.</span>}
              when={offlineReady()}
            >
              <span>App ready to work offline</span>
            </Show>
          </div>
          <Show when={needRefresh()}>
            <button class={styles.ToastButton} onClick={() => updateServiceWorker(true)}>Reload</button>
          </Show>
          <button class={styles.ToastButton} onClick={() => close()}>Close</button>
        </div>
      </Show>
    </div>
  )
}

export default ReloadPrompt