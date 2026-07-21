import { Show, For, Accessor, createMemo, Component } from "solid-js";
import { SectionCard } from "../SectionCard/SectionCard";
import { Swords } from "coles-solid-library/icons";
import styles from "../../sheet.module.scss";

type attackrow = {
    name: string;
    hit: string;
    damage: string;
    notes: string;
}

interface props {
    attackRows: Accessor<attackrow[]>;
}

export const AttacksCard:Component<props> = (props) => {
    const attackRows = createMemo(() => props.attackRows());

    return <Show when={attackRows().length}>
      <SectionCard icon={Swords} title="Attacks & Cantrips">
        <table class={styles.dataTable}>
          <thead>
            <tr><th>Name</th><th>Hit / DC</th><th>Damage</th><th>Notes</th></tr>
          </thead>
          <tbody>
            <For each={attackRows()}>
              {(row) => (
                <tr>
                  <td>{row.name}</td>
                  <td><span class={styles.tag}>{row.hit}</span></td>
                  <td><span class={styles.tag}>{row.damage}</span></td>
                  <td class={styles.notesCell}>{row.notes}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </SectionCard>
    </Show>
}



/*
const AttacksCard = () => (
    <Show when={attackRows().length}>
      <SectionCard icon={Swords} title="Attacks & Cantrips">
        <table class={styles.dataTable}>
          <thead>
            <tr><th>Name</th><th>Hit / DC</th><th>Damage</th><th>Notes</th></tr>
          </thead>
          <tbody>
            <For each={attackRows()}>
              {(row) => (
                <tr>
                  <td>{row.name}</td>
                  <td><span class={styles.tag}>{row.hit}</span></td>
                  <td><span class={styles.tag}>{row.damage}</span></td>
                  <td class={styles.notesCell}>{row.notes}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </SectionCard>
    </Show>
  );

  */