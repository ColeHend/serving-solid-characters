import { For, Component } from "solid-js";
import { Button, Select, Option, Input, Checkbox } from "coles-solid-library";
import { UsePdfFieldMapperReturn } from "../usePdfFieldMapper";
import styles from "./FieldToolbar.module.scss";

interface Props {
  state: UsePdfFieldMapperReturn;
}

const FieldToolbar: Component<Props> = (p) => {
  const s = p.state;
  return (
    <div class={styles.toolbar}>
      <label class={`${styles.fieldGroup} ${styles.min120}`}>
        Field
        <Select
          value={s.activeKey()}
          onChange={(e: any) => {
            const v =
              typeof e === "string"
                ? e
                : e?.target?.value ?? e?.currentTarget?.value ?? s.activeKey();
            s.setActiveKey(v);
          }}
        >
          <For each={s.fieldOptions()}>
            {(opt) => <Option value={opt}>{opt}</Option>}
          </For>
        </Select>
      </label>
      <label class={`${styles.fieldGroup} ${styles.w70}`}>
        Size
        <Input
          type="number"
          min="6"
          max="48"
          value={s.fontSize()}
          onInput={(e) => s.setFontSize(parseInt(e.currentTarget.value) || 12)}
        />
      </label>
      <label class={`${styles.fieldGroup} ${styles.min120}`}>
        Font
        <Select
          value={s.fontName()}
          onChange={(e: any) => {
            const v =
              typeof e === "string"
                ? e
                : e?.target?.value ?? e?.currentTarget?.value ?? s.fontName();
            s.setFontName(v);
          }}
        >
          <Option value="Helvetica">Helvetica</Option>
          <Option value="TimesRoman">Times</Option>
          <Option value="Courier">Courier</Option>
        </Select>
      </label>
      <label class={`${styles.fieldGroup} ${styles.w70}`}>
        Color
        <Input
          type="color"
          value={s.fontColor()}
          onInput={(e) => s.setFontColor(e.currentTarget.value)}
        />
      </label>
      <label class={`${styles.fieldGroup} ${styles.w75}`}>
        Scale
        <Input
          type="number"
          step="0.1"
          min="0.2"
          max="4"
          value={s.scale()}
          onInput={(e) => s.setScale(parseFloat(e.currentTarget.value) || 1)}
        />
      </label>
      <div
        class={styles.pageNav}
        aria-busy={s.loadingPage()}
        data-loading={s.loadingPage() ? "true" : "false"}
      >
        <Button aria-label="Prev Page" onClick={s.requestPrevPage}>
          ◀
        </Button>
        <span>
          Page {s.pageIndex() + 1}/{s.pageCount()}
        </span>
        <Button aria-label="Next Page" onClick={s.requestNextPage}>
          ▶
        </Button>
      </div>
      <div class={styles.actions}>
        <Button onClick={s.exportJson}>Export</Button>
        <label class={styles.fieldGroup}>
          Import
          <Input
            data-testid="import-json"
            type="file"
            accept="application/json"
            onChange={s.importJson}
          />
        </label>
        <Button onClick={s.saveMappings}>Save</Button>
        <Button onClick={s.loadMappings}>Load</Button>
        <Button
          onClick={() => {
            s.setMappings([]);
          }}
        >
          Clear
        </Button>
        <Button
          data-testid="preview-toggle"
          onClick={() => {
            s.setPreviewMode((p) => !p);
            s.setSelectedId(null);
          }}
        >
          {s.previewMode() ? "Edit View" : "Preview"}
        </Button>
        <div class={styles.uniqueWrap}>
          <div
            class={styles.uniqueWrap}
            title="When checked only one mapping per field key can be placed"
          >
            {/* <Checkbox data-testid='unique-toggle' label="Unique Field" checked={s.singleInstance()} onChange={(val: boolean) => s.setSingleInstance(val)} /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldToolbar;
