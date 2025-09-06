import { Component, Show, createEffect, createSignal } from 'solid-js';
import { UsePdfFieldMapperReturn } from '../usePdfFieldMapper';
import styles from './PdfCanvas.module.scss';

interface Props { state: UsePdfFieldMapperReturn; pdfBytes: Uint8Array | null; }

const PdfCanvas: Component<Props> = (p) => {
  const s = p.state;
  const [renderAttempts, setRenderAttempts] = createSignal(0);
  const [renderError, setRenderError] = createSignal<string | null>(null);
  
  // Force canvas visibility once we have PDF bytes
  let canvasRef: HTMLCanvasElement | undefined;
  createEffect(() => {
    if (p.pdfBytes && canvasRef) {
      // Always ensure canvas is visible when we have bytes
      canvasRef.style.display = 'block';
      
      // Reset error state when PDF bytes change
      setRenderError(null);
      
      // Track render attempts
      setRenderAttempts(a => a + 1);
      
      // Manual render fallback if no PDF is showing after a delay
      if (!s.basePageImage() && renderAttempts() > 1) {
        setTimeout(() => {
          if (!s.basePageImage() && canvasRef) {
            try {
              // Create a fallback render directly on the canvas
              const ctx = canvasRef.getContext('2d');
              if (ctx) {
                // Ensure canvas has dimensions
                if (canvasRef.width === 0) canvasRef.width = 800;
                if (canvasRef.height === 0) canvasRef.height = 1100;
                
                // Clear canvas with white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvasRef.width, canvasRef.height);
                
                // Add subtle grid pattern for visual reference
                ctx.strokeStyle = '#eeeeee';
                ctx.lineWidth = 1;
                for (let i = 0; i < canvasRef.width; i += 50) {
                  ctx.beginPath();
                  ctx.moveTo(i, 0);
                  ctx.lineTo(i, canvasRef.height);
                  ctx.stroke();
                }
                for (let i = 0; i < canvasRef.height; i += 50) {
                  ctx.beginPath();
                  ctx.moveTo(0, i);
                  ctx.lineTo(canvasRef.width, i);
                  ctx.stroke();
                }
                
                // Show debug text
                ctx.font = '14px sans-serif';
                ctx.fillStyle = '#333';
                ctx.fillText(`PDF Size: ${p.pdfBytes?.length ?? 0} bytes`, 20, 30);
                ctx.fillText(`Render attempts: ${renderAttempts()}`, 20, 50);
                ctx.fillText(`Page: ${s.pageIndex() + 1} of ${s.pageCount()}`, 20, 70);
                ctx.fillText(`Scale: ${s.scale()}`, 20, 90);
                
                setRenderError('Using emergency fallback rendering');
              }
            } catch (err) {
              console.error('Emergency render failed:', err);
              setRenderError('Emergency rendering failed');
            }
          }
        }, 1000);
      }
    }
  });
  
  return (
    <div class={styles.canvasContainer}>
      <Show when={p.pdfBytes !== null} fallback={<p class={styles.canvasFallback}>No PDF loaded.</p>}>
        <div class={styles.canvasWrapper}>
          {/* Always show canvas once we have bytes, even before rendering completes */}
          <canvas 
            data-testid="pdf-canvas" 
            ref={(el) => { s.setCanvasEl(el); canvasRef = el; }}
            class={styles.canvasEl} 
            style={{ "min-width": "600px", "min-height": "800px" }}
            onClick={s.handleCanvasClick as any} 
            onPointerDown={s.onPointerDown as any}
          ></canvas>
          
          {/* Loading overlay - show when loading or when we have no base image */}
          <Show when={s.loadingPage() || (!s.basePageImage() && p.pdfBytes)}>
            <div class={styles.loadingOverlay}>
              <div class={styles.loadingSpinner}></div>
              <p>{s.loadingPage() ? 'Rendering PDF page...' : 'Waiting for PDF to render...'}</p>
              <Show when={renderAttempts() > 2 && !s.basePageImage()}>
                <p class={styles.renderHelp}>
                  Still waiting for PDF to render...
                  <br />
                  Attempt #{renderAttempts()}
                </p>
              </Show>
              <Show when={renderError()}>
                <p class={styles.renderError}>{renderError()}</p>
              </Show>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};
export default PdfCanvas;
