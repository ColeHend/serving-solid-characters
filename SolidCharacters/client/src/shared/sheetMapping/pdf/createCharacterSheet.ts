import { addSnackbar } from 'coles-solid-library';
import { Character } from '../../../models/character.model';
import { Stats } from '../../customHooks/dndInfo/useCharacters';
import { downloadBlob } from '../../customHooks/utility/tools/downloadBlob';
import { mappingStore } from '../mappingStore';
import { characterToSheetValues } from './characterToSheetValues';
import { generateSheetPdf } from './generateSheetPdf';

/**
 * The orchestrator behind every "Create Character Sheet" button: runs the saved
 * default mapping against a character and downloads the filled PDF.
 *
 *   characterToSheetValues → mappingStore default template → generateSheetPdf → downloadBlob
 *
 * Takes a PLAIN `Stats` object (the effective ability scores), computed by the
 * caller in-component via `useExportFullStats`. This module is headless (no Solid
 * owner), so it must NEVER call that hook itself.
 */
export async function createCharacterSheet(char: Character | undefined, fullStats: Stats): Promise<void> {
  if (!char) {
    addSnackbar({ message: 'No character selected', severity: 'warning' });
    return;
  }

  try {
    const values = characterToSheetValues(char, fullStats);
    const bytes = await generateSheetPdf(values, mappingStore.template());
    // Wrap in a fresh Uint8Array so the bytes satisfy `BlobPart` (pdf-lib's
    // typed-array buffer type is otherwise too wide for the DOM Blob lib types).
    downloadBlob(new Uint8Array(bytes), `${char.name || 'character'}.pdf`, 'application/pdf');
    addSnackbar({ message: 'Character sheet created', severity: 'success' });
  } catch (err) {
    console.error('createCharacterSheet failed', err);
    addSnackbar({ message: 'Failed to create character sheet', severity: 'error' });
  }
}
