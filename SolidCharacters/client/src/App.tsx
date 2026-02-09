import { type Component, createSignal, createEffect, ErrorBoundary, onCleanup, onMount } from 'solid-js';
import { getUserSettings, } from './shared';
import { Button, Container } from 'coles-solid-library';
import styles from './App.module.scss';

const App: Component = () => {
  console.log("App component initializing");

  onMount(() => {
    document.body.classList.add('home-bg');
  });

  onCleanup(() => {
    document.body.classList.remove('home-bg');
  });
  
  // Initialize state with safe defaults
  const [userSettings, setUserSettings] = createSignal({ theme: 'dark' });
  const [isLoading, setIsLoading] = createSignal(true);

  try {
    // Safely get user settings
    const [settings, setSettings] = getUserSettings();
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
    console.log("App component finished loading");
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
          
          <div>
        
            <div style={{
              display: 'flex',
              "flex-direction": 'row',
              gap: "10%"
            }}>
              <span>
                <h2>Completed Features</h2>

                <ul>
                  <li>Dark Mode & Theming</li>
                  
                  <li>Info Viewer & Pop ups</li>
                  <li>Homebrew Content Support</li>
                  <li>Search, Pagination, Filtering</li>
                  <li>PWA/Offline Support</li>
                </ul>
              </span>

              <span>
                <h2>Upcoming Features</h2>

                <ul>
                  <li>Accessibility & Mobile UI Improvements</li>
                  <li>Deeper Homebrew Management (create/edit/share)</li>
                  <li>Character Builder & Viewer</li> 
                  <li>Generate a Filled Character sheet PDF</li>
                  <li>Generate Homebrew with AI</li>
                  <li>Admin/GM Tools</li>
                </ul>
              </span>

            </div>

          </div>
          
    
        </Container>
      )}
    </ErrorBoundary>
  );
};

export default App;
