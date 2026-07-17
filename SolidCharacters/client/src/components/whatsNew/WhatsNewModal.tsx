import { Component, For, Setter, createSignal, onMount } from 'solid-js';
import { Button, Modal } from 'coles-solid-library';
import { latestRelease } from '../../shared/constants/changelog';
import styles from './whatsNew.module.scss';

const DISMISS_KEY = 'changelog:dismissed';

const readDismissedVersion = (): string | null => {
  try {
    return localStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
};

const writeDismissedVersion = () => {
  try {
    localStorage.setItem(DISMISS_KEY, latestRelease.version);
  } catch (err) {
    console.warn('Failed to persist What\'s New dismissal:', err);
  }
};

export const WhatsNewModal: Component = () => {
  const [show, setShow] = createSignal(false);

  onMount(() => {
    if (readDismissedVersion() !== latestRelease.version) setShow(true);
  });

  // Persist the dismissal on every close path (button, X, Escape, backdrop).
  const setShowAndPersist = ((value: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof value === 'function' ? value(show()) : value;
    if (!next) writeDismissedVersion();
    return setShow(next);
  }) as Setter<boolean>;

  return (
    <Modal
      title={`What's New — ${latestRelease.title}`}
      show={[show, setShowAndPersist]}
      width="520px"
      height="fit-content"
    >
      <div class={styles.body}>
        <p class={styles.date}>{latestRelease.date}</p>
        <ul>
          <For each={latestRelease.changes}>{(change) => <li>{change}</li>}</For>
        </ul>
        <div class={styles.actions}>
          <Button theme="primary" onClick={() => setShowAndPersist(false)}>Got it</Button>
        </div>
      </div>
    </Modal>
  );
};
