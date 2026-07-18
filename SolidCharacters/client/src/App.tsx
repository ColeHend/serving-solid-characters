import { type Component, createSignal, createEffect, ErrorBoundary, For, onCleanup, onMount } from 'solid-js';
import { getUserSettings, } from './shared';
import { Button, Container } from 'coles-solid-library';
import { changelog, upcomingFeatures } from './shared/constants/changelog';
import { WhatsNewModal } from './components/whatsNew/WhatsNewModal';
import styles from './App.module.scss';

const App: Component = () => {
  onMount(() => {
    document.body.classList.add('home-bg');
  });

  onCleanup(() => {
    document.body.classList.remove('home-bg');
  });
  
  // Initialize state with safe defaults
  const [, setUserSettings] = createSignal({ theme: 'dark' });
  const [isLoading, setIsLoading] = createSignal(true);

  try {
    // Safely get user settings
    const [settings] = getUserSettings();
    createEffect(() => {
      try {
        setUserSettings((old)=>({
          ...old,
          theme: settings().theme,
        }));
      } catch (error) {
        console.error("Failed to update user settings:", error);
      }
    });
  } catch (error) {
    console.error("Failed to initialize user settings:", error);
  }

  // Mark loading as complete after a short delay to ensure UI renders
  setTimeout(() => {
    setIsLoading(false);
  }, 500);

  return (
    <ErrorBoundary fallback={(err) => (
      <Container theme='surface' class={styles.errorContainer}>
        <h2>Something went wrong in the application</h2>
        <p>We encountered an error while loading the application:</p>
        <pre>{err.toString()}</pre>
        <Button onClick={() => window.location.reload()}>Reload Application</Button>
      </Container>
    )}>
      {isLoading() ? (
        <Container theme='surface' class={styles.loadingContainer}>
          <h2>Loading application data...</h2>
          <p>Please wait while we load your content</p>
        </Container>
      ) : (
        <Container class={`${styles.body}`} theme='container'>
          <div class={`${styles.topRow}`}>
            <h1>Home</h1>
          </div>
          
          <div class={styles.featureColumns}>
            <span class={styles.updateNotes}>
              <h2>Update Notes</h2>

              <For each={changelog}>{(release) => (
                <section>
                  <h3>{release.title} — {release.date}</h3>

                  <ul>
                    <For each={release.changes}>{(change) => <li>{change}</li>}</For>
                  </ul>
                </section>
              )}</For>
            </span>

            <span>
              <h2>Upcoming Features</h2>

              <ul>
                <For each={upcomingFeatures}>{(feature) => <li>{feature}</li>}</For>
              </ul>
            </span>
          </div>

          <WhatsNewModal />
        </Container>
      )}
    </ErrorBoundary>
  );
};

export default App;
