import { Component, Show, createSignal } from "solid-js";
import { Button, Container } from "coles-solid-library";

interface ErrorFallbackProps {
  error: unknown;
  /** Heading shown to the user. */
  title?: string;
  /** Override the reload action (defaults to a full page reload). */
  onReload?: () => void;
}

/**
 * Themed error screen reused by the app-shell and route ErrorBoundaries. Uses the design
 * system (Container theme="error" + Button) and theme color vars instead of hardcoded
 * red-on-white, so the dark theme is preserved; exposes role="alert" for assistive tech and
 * tucks the raw error message behind a collapsible <details> rather than a prominent <pre>.
 */
const ErrorFallback: Component<ErrorFallbackProps> = (props) => {
  const [showDetails, setShowDetails] = createSignal(false);
  const message = () => {
    const e = props.error as { message?: string } | undefined;
    return String(e?.message ?? props.error ?? "Unknown error");
  };
  const reload = () => (props.onReload ? props.onReload() : window.location.reload());

  return (
    <Container
      theme="error"
      role="alert"
      style={{ margin: "var(--spacing-3)", padding: "var(--spacing-3)", "border-radius": "8px" }}
    >
      <h2 style={{ "margin-top": 0 }}>{props.title ?? "Something went wrong"}</h2>
      <p style={{ opacity: 0.9 }}>The app hit an unexpected error. Reloading usually fixes it.</p>
      <div style={{ display: "flex", gap: "var(--spacing-2)", "align-items": "center", "flex-wrap": "wrap" }}>
        <Button theme="primary" onClick={reload}>Reload</Button>
        <Button transparent onClick={() => setShowDetails((v) => !v)}>
          {showDetails() ? "Hide details" : "Show details"}
        </Button>
      </div>
      <Show when={showDetails()}>
        <pre
          style={{
            "white-space": "pre-wrap",
            "overflow-x": "auto",
            opacity: 0.8,
            "font-size": "var(--font-size-small)",
            "margin-top": "var(--spacing-2)",
          }}
        >{message()}</pre>
      </Show>
    </Container>
  );
};

export default ErrorFallback;
