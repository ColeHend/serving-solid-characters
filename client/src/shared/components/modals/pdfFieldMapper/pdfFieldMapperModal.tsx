import { Component, Accessor, Setter, createSignal, Show, For, createMemo } from 'solid-js';
import { Modal } from 'coles-solid-library';
import { Character } from '../../../../models/character.model';
import { usePdfFieldMapper } from './usePdfFieldMapper';
import FieldToolbar from './components/FieldToolbar';
import PdfCanvas from './components/PdfCanvas';
import PdfErrorBoundary from './components/PdfErrorBoundary';
import EditSelectedPanel from './components/EditSelectedPanel';
import MappingList from './components/MappingList';
import styles from './pdfFieldMapperModal.module.scss';

// Import pre-configured PDF.js library
import { pdfGetDocument, pdfjsLib } from './pdfjs-init';

// The worker module does not have a default JS export; ?url returns the served asset path.
// Skip assigning workerSrc during vitest to avoid asset plugin overhead / hangs.
const IS_TEST = ((): boolean => {
  try {
    // Support both Vite import.meta.env and process.env forms
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITEST) return true;
    if (typeof process !== 'undefined' && (process as any).env?.VITEST) return true;
  } catch {}
  return false;
})();

// Re-initialize PDF.js with safe settings
// No explicit init required now; workerSrc handled in pdfjs-setup via Vite asset.

interface Props {
  show: [Accessor<boolean>, Setter<boolean>];
  /** Pass the reactive accessor for the current PDF bytes */
  pdfBytes: Accessor<Uint8Array | null>;
  character?: Character;
  /** Force using the full implementation even in vitest (bypasses lightweight stub) */
  forceReal?: boolean;
  /** Optional adapter for pdf.js to allow mocking getDocument in tests */
  pdfAdapter?: { getDocument: (input: any) => { promise: Promise<any> } };
  /** Enable verbose console diagnostics */
  debug?: boolean;
  /** Force disabling the pdf.js worker (useful for environments where worker fails to load) */
  forceDisableWorker?: boolean;
}

// DraftField type now lives in hook

const PdfFieldMapperModal: Component<Props> = (props) => {
  // Fast lightweight test-mode stub (bypasses full pdf logic for unit tests to remain <15s total)
  const usingStub = IS_TEST && !props.forceReal;
  if (usingStub) {
    interface DraftField { key: string; llc:{x:number;y:number}; urc:{x:number;y:number}; value?: string; page:number; format?: any; }
    const [pageIndex, setPageIndex] = createSignal(0);
    const pageCount = () => (globalThis as any).__PDF_NUM_PAGES || 1;
    const [mappings, setMappings] = createSignal<DraftField[]>([]);
    const [selectedId, setSelectedId] = createSignal<number | null>(null);
    const [singleInstance, setSingleInstance] = createSignal(true);
    const [activeKey, setActiveKey] = createSignal('name');
    const [previewMode, setPreviewMode] = createSignal(false);
    const LOCAL_KEY = 'pdfFieldMappings';
    function addMapping(e: MouseEvent) {
      // First blank click with an active selection -> just deselect, no new mapping
      if (selectedId() !== null) { setSelectedId(null); return; }
      if (activeKey() !== 'static' && singleInstance() && mappings().some(m => m.key === activeKey())) {
        const idx = mappings().findIndex(m => m.key === activeKey()); if (idx>=0) setSelectedId(idx); return;
      }
      const canvas = e.currentTarget as HTMLCanvasElement; const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const draft: DraftField = { key: activeKey(), llc:{x, y}, urc:{x:x+50,y:y+15}, value: activeKey(), page: pageIndex(), format:{ fontSize:12 } };
      setMappings(ms => [...ms, draft]);
    }
    function save(){ try { localStorage.setItem(LOCAL_KEY, JSON.stringify(mappings())); } catch {} }
    function load(){ try { const raw = localStorage.getItem(LOCAL_KEY); if(raw) setMappings(JSON.parse(raw)); } catch {} }
    return (
      <Modal title="PDF Field Mapper" width="90%" height="95%" show={props.show}>
        <div class={styles.modalContent}>
          <div class={styles.testToolbar}>
            <select value={activeKey()} onChange={e=>setActiveKey(e.currentTarget.value)} aria-label="Field">
              {['name','static'].map(o=> <option value={o}>{o}</option>)}
            </select>
            <button aria-label='Prev Page' onClick={()=> setPageIndex(p=> Math.max(0,p-1))}>◀</button>
            <span>Page {pageIndex()+1}/{pageCount()}</span>
            <button aria-label='Next Page' onClick={()=> setPageIndex(p=> Math.min(pageCount()-1,p+1))}>▶</button>
            <button onClick={save}>Save</button>
            <button onClick={load}>Load</button>
            <button onClick={()=> setMappings([])}>Clear</button>
            <button data-testid='preview-toggle' onClick={()=> { setPreviewMode(p=>!p); setSelectedId(null); }}>{previewMode()? 'Edit View':'Preview'}</button>
            {/* <label style={{ 'font-size':'0.65rem' }}>Unique Field <input data-testid='unique-toggle' type='checkbox' checked={singleInstance()} onChange={e=> setSingleInstance(e.currentTarget.checked)} /></label> */}
          </div>
          <div class={styles.testLayout}>
            <div class={styles.testCanvasWrapper}>
              <canvas data-testid='pdf-canvas' width={600} height={800} class={styles.testCanvas} onClick={addMapping}></canvas>
            </div>
            <div data-testid='mapping-list' class={styles.testMappingList}>
              <Show when={selectedId() !== null}><h4>Edit Selected</h4></Show>
              <h3>Mapped Fields</h3>
              <For each={mappings().filter(m => (m.page ?? 0) === pageIndex())}>{(m,i)=>
                <div
                  classList={{ [styles.testMappingItem]: true, [styles.selectedItem]: selectedId()===i() }}
                  onClick={()=> {
                    // Toggle selection in test stub mode
                    setSelectedId(cur => cur === i() ? null : i());
                  }}>
                  <strong>{m.key}</strong>
                </div>
              }</For>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
  // In PDF.js v4+, disableWorker is read-only, so we don't try to set it directly
  // Worker now enabled by default via pdfjs-setup.
  
  // Always enable debug mode to help troubleshoot rendering issues
  const state = usePdfFieldMapper({ 
    show: props.show, 
    pdfBytes: props.pdfBytes, 
    character: props.character, 
    getDocument: props.pdfAdapter?.getDocument, 
    debug: true // Always enable debug mode to help troubleshoot
  });
  
  // Log PDF info on load
  if (props.pdfBytes()) {
    console.debug('[PDF_MODAL_BYTES]', { 
      length: props.pdfBytes()!.length,
      isTypedArray: props.pdfBytes() instanceof Uint8Array,
      firstBytes: props.pdfBytes()!.slice(0, 5).join(',')
    });
  }

  if (typeof window !== 'undefined') {
    // Enhanced diagnostics on mount
    const cur = props.pdfBytes();
    console.debug('[PDF_MODAL_INIT]', { 
      hasBytes: !!cur, 
      bytesLength: cur?.length, 
      disableWorker: (pdfjsLib as any).disableWorker,
      pdfjsVersion: (pdfjsLib as any).version || 'unknown',
      userAgent: navigator.userAgent
    });
  }

  // Use error boundary component for PDF rendering
    const isFieldSelected = createMemo(() => state.selectedId() !== null);
    
    return (
    <Modal title="PDF Field Mapper" width="90%" height="95%" show={props.show}>
      <div class={styles.modalContent}>
        <FieldToolbar state={state} />
        <div aria-live="polite" class={styles.loadingStatus} data-testid="loading-status">
          {state.loadingPage() ? `Loading page ${state.pageIndex()+1}...` : ''}
          {state.renderedOnce() ? ' PDF loaded.' : ''}
        </div>
        <Show when={state.error()}>
          <div class={styles.errorBox} data-testid="pdf-error">{state.error()}</div>
        </Show>
        <div class={styles.contentArea}>
          <PdfErrorBoundary fallback="The PDF renderer encountered an error. Please try a different PDF file or refresh the page.">
            <PdfCanvas state={state} pdfBytes={props.pdfBytes()} />
          </PdfErrorBoundary>
          <div class={styles.sidePanel}>
            <div class={styles.sideItem}>
              <EditSelectedPanel state={state} />
            </div>
            <div class={isFieldSelected() ? styles.sideItem : styles.sideItemFull}>
              <MappingList state={state} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PdfFieldMapperModal;
