import { Component, createMemo } from 'solid-js';
import { Button, Icon } from 'coles-solid-library';
import { Character } from '../../models/character.model';
import useExportFullStats from '../../shared/customHooks/dndInfo/useGetFullStats';
import { createCharacterSheet } from '../../shared/sheetMapping/pdf/createCharacterSheet';

interface Props {
  character: Character | undefined;
  /** Render transparent (e.g. when sitting in a toolbar of transparent buttons). */
  transparent?: boolean;
  /** Override the default label text. */
  label?: string;
}

/**
 * Shared "Create Character Sheet" trigger (view + list screens). Computes the
 * effective `Stats` in-component (Solid owner context) via `useExportFullStats`,
 * then hands a plain object to the headless `createCharacterSheet` orchestrator.
 *
 * `type="button"` keeps it inert inside any wrapping `<Form>`; an undefined
 * character disables the button and `createCharacterSheet` null-guards anyway.
 */
export const CreateSheetButton: Component<Props> = (props) => {
  const character = createMemo(() => props.character);
  // useExportFullStats reads race.species defensively, so an undefined character
  // yields neutral stats rather than throwing; the disabled guard blocks generation.
  const fullStats = useExportFullStats(() => character() as Character);

  return (
    <Button
      type="button"
      transparent={props.transparent}
      disabled={!character()}
      onClick={() => void createCharacterSheet(character(), fullStats())}
    >
      <Icon name="picture_as_pdf" /> {props.label ?? 'Create Character Sheet'}
    </Button>
  );
};
