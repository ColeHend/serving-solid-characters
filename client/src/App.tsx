import { type Component, createSignal, createEffect, ErrorBoundary } from 'solid-js';
import { createExampleCharacter, getUserSettings, } from './shared';
import { addSnackbar, Button, Container, Input, Icon, Menu, MenuItem, Carousel, type CarouselElement } from 'coles-solid-library';
import styles from './App.module.scss';
import { generateCharacterPdf } from './shared/customHooks/libraries/characterPdf';
import { GetPDFTool } from './shared/customHooks/libraries/pdfTool';
import PdfFieldMapperModal from './shared/components/modals/pdfFieldMapper/pdfFieldMapperModal';
// ------- CHar -------------------------------------------------------------------
const Gandalf = createExampleCharacter({
      name: "Gandalf",
      experience: 2000,
      initiative: 2,
      speed: 30,
      ac: 12,
      level: 20,
      levels: [
        {
          class: "Wizard",
          subclass: "Evocation",
          level: 1,
          hitDie: 6,
          features: [
            {
              name: "Spellcasting",
              description: "You can cast wizard spells using your spellbook.",
              metadata: {
                category: "Class"
              }
            },
          ]
        },
        {
          class: "Wizard",
          subclass: "Evocation",
          level: 2,
          hitDie: 6,
          features: [
            {
              name: "Arcane Recovery",
              description: "You can recover some spell slots during a short rest.",
              metadata: {
                category: "Class"
              }
            }
          ]
        }
      ],
      spells: [
        {
          name: "Fireball",
          prepared: true,
        },
        {
          name: "Magic Missile",
          prepared: true,
        },
        {
          name: "Shield",
          prepared: false,
        },
        {
          name: "Mage Armor",
          prepared: true,
        },
        {
          name: "Detect Magic",
          prepared: true,
        },
        {
          name: "Identify",
          prepared: false,
        },
        {
          name: "Mending",
          prepared: true,
        },
        {
          name: "Light",
          prepared: true,
        }
      ],
      race: {
        species: "elf",
        subrace: "woodElf",
        age: "200",
        size: "Medium",
        speed: "30ft",
        features: [
          {
            name: "Darkvision",
            description: "You can see in dim light within 60 feet as if it were bright light.",
            metadata: {}
          }
        ]
      },
      className: "Wizard",
      subclass: "Evocation",
      background: "Noble",
      alignment: "neutral",
      proficiencies: {
        skills: {
          "Acrobatics": {
            stat: "dex",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Animal Handling": {
            stat: "wis",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Arcana": {
            stat: "int",
            value: 10,
            proficient: true,
            expertise: true
          },
          "History": {
            stat: "int",
            value: 10,
            proficient: true,
            expertise: true
          },
          "Athletics": {
            stat: "str",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Deception": {
            stat: "cha",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Insight": {
            stat: "wis",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Intimidation": {
            stat: "cha",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Investigation": {
            stat: "int",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Medicine": {
            stat: "wis",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Nature": {
            stat: "int",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Perception": {
            stat: "wis",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Performance": {
            stat: "cha",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Persuasion": {
            stat: "cha",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Religion": {
            stat: "int",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Sleight Of Hand": {
            stat: "dex",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Stealth": {
            stat: "dex",
            value: 0,
            proficient: false,
            expertise: false,
          },
          "Survival": {
            stat: "wis",
            value: 0,
            proficient: false,
            expertise: false,
          },
        },
        other: {}
      },
      languages: [
        "Common",
        "elvish",
        "draconic"
      ],
      health: {
        max: 1,
        current: 1,
        temp: 10,
        hitDie: { total: 2, die: 6, used: 0 }
      },
      stats: {
        str: 8,
        dex: 14,
        con: 12,
        int: 15,
        wis: 13,
        cha: 10,
      },
      items: {
        inventory: [
          "Spellbook",
          "Quarterstaff",
          "Component Pouch",
          "Explorer's Pack"
        ],
        equipped: [
          "Quarterstaff",
          "Spellbook"
        ],
        attuned: [
          "Ring of Protection"
        ]
      },
      profiencyBonus: 0,
      size: "Medium"
    });
// --------------------------------------------------------------


const App: Component = () => {
  console.log("App component initializing");
  
  // Initialize state with safe defaults
  const [userSettings, setUserSettings] = createSignal({ theme: 'dark' });
  const [isLoading, setIsLoading] = createSignal(true);
  // Fix: incorrect generic (Uint8Array does not take a type parameter)
  const [pdfBytes, setPdfBytes] = createSignal<Uint8Array | null>(null);
  const [showPdfMapper, setShowPdfMapper] = createSignal(false);

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

  const generatePDF = async () => {
    
    if (!pdfBytes()) {
      console.warn("No PDF loaded to generate from.");
      return;
    }
  const pdf = await generateCharacterPdf(pdfBytes()!, '2024', Gandalf);
  // Some TS lib types make Uint8Array generic not match BlobPart; use underlying ArrayBuffer
  const pdfData = pdf instanceof Uint8Array ? pdf : new Uint8Array(pdf as unknown as ArrayBufferLike);
  const blob = new Blob([pdfData.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  const logPdfFields = async () => {
    const pdfDoc = pdfBytes();
    if (!pdfDoc) {
      console.warn("No PDF loaded to log fields from.");
      return;
    }
    const tool = await GetPDFTool(pdfDoc);
    const fields = tool.getFieldNames();
    console.log("PDF Fields:", fields);
  }
  
  const uploadPdf = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files ? target.files[0] : null;
    if (!file) { setPdfBytes(null); return; }
    // Some browsers may not set file.type reliably; validate header magic number %PDF-
    const reader = new FileReader();
    reader.onerror = () => { setPdfBytes(null); addSnackbar({ message: 'Failed to read file', severity: 'error' }); };
    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer);
        const header = new TextDecoder().decode(bytes.slice(0, 5));
        if (header !== '%PDF-') {
          setPdfBytes(null);
            console.warn('Selected file is not a PDF (header check failed). Header:', header);
          addSnackbar({ message: 'Not a valid PDF file', severity: 'warning' });
          return;
        }
        setPdfBytes(bytes);
        console.debug('[PDF_UPLOAD]', { size: bytes.length });
        addSnackbar({ message: 'PDF loaded successfully', severity: 'success' });
      } catch (err) {
        console.error('PDF upload failed', err);
        setPdfBytes(null);
        addSnackbar({ message: 'Failed to parse PDF', severity: 'error' });
      }
    };
    // Only read first ~1KB early for header validation, then full file (simplified: read full now)
    reader.readAsArrayBuffer(file);
}
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
            <h2>PDF Test</h2>
            <p>
              <span>PDF upload:</span>
              <Input type='file' accept='application/pdf' onChange={uploadPdf}/>
            </p>
            <p>
              <Button onClick={logPdfFields} >Log Fields</Button>
            </p>
            <p>
              <Button  onClick={generatePDF} >Download</Button>
            </p>
            <p>
              <Button disabled={!pdfBytes()} onClick={() => setShowPdfMapper(true)}>Open PDF Mapper</Button>
            </p>
          </div>
          <PdfFieldMapperModal debug forceDisableWorker pdfBytes={pdfBytes} show={[showPdfMapper, setShowPdfMapper]} character={Gandalf as any} />
          
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
