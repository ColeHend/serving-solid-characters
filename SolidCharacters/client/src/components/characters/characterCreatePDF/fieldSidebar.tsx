import { Accessor, Component, Setter } from 'solid-js';
import { TabBar } from 'coles-solid-library';
import { PlacedField } from '../../../shared/sheetMapping';
import { FieldPalette } from './fieldPalette';
import { FieldInspector } from './fieldInspector';
import styles from './characterCreatePDF.module.scss';

interface FieldSidebarProps {
  /** Active sidebar tab: 0 = Add (palette), 1 = Edit (inspector). */
  tab: Accessor<number>;
  setTab: Setter<number>;
  // Add tab (palette)
  placedKeys: () => Set<string>;
  onGrab: (x: number, y: number) => void;
  onAdd: (fieldKey: string) => void;
  // Edit tab (inspector)
  field: () => PlacedField | null;
  templateId: string;
  onRemove: (key: string) => void;
}

const TABS = ['Add', 'Edit'];

/**
 * The combined right-hand sidebar: a tab bar switching between the drag/tap
 * field palette ("Add") and the selected-field metadata editor ("Edit"). Docked
 * beside the canvas on desktop; rendered inside a Modal on mobile (same instance,
 * so tab state is shared via the parent's `tab` signal).
 *
 * Both panes stay MOUNTED; the inactive one is hidden with `display:none` rather
 * than unmounted. This keeps the palette's draggables registered and — crucially
 * — avoids tearing down/rebuilding the tree on every tab switch, which (when it
 * coincided with a drag-end flush) cascaded into a "too much recursion" crash.
 */
export const FieldSidebar: Component<FieldSidebarProps> = (props) => {
  return (
    <div class={styles.sidebarInner}>
      <TabBar tabs={TABS} activeTab={props.tab()} onTabChange={(_l, i) => props.setTab(i)} tabPosition="stretch" />
      <div class={styles.sidebarBody}>
        <div classList={{ [styles.hiddenTab]: props.tab() !== 0 }}>
          <FieldPalette placedKeys={props.placedKeys} onGrab={props.onGrab} onAdd={props.onAdd} />
        </div>
        <div classList={{ [styles.hiddenTab]: props.tab() !== 1 }}>
          <FieldInspector field={props.field} templateId={props.templateId} onRemove={props.onRemove} />
        </div>
      </div>
    </div>
  );
};
