import { Component, ErrorBoundary } from 'solid-js';
import styles from '../pdfFieldMapperModal.module.scss';

interface Props {
  children: any;
  fallback?: string;
}

const PdfErrorBoundary: Component<Props> = (props) => {
  return (
    <ErrorBoundary fallback={(err, reset) => (
      <div class={styles.errorBoundary}>
        <h3>PDF Rendering Error</h3>
        <p>{props.fallback || 'An error occurred while rendering the PDF.'}</p>
        <div class={styles.errorDetails}>
          <pre>{err.toString()}</pre>
        </div>
        <button onClick={reset}>Try again</button>
      </div>
    )}>
      {props.children}
    </ErrorBoundary>
  );
};

export default PdfErrorBoundary;
