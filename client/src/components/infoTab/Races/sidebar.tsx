import { Component, For, Show } from "solid-js";
import { Race } from "../../../models/race.model";
import useStyle from "../../../customHooks/utility/style/styleHook";
import Banner from "./banner";

type Props = {
    dndSrdRaces: () => Race[];
    styles: CSSModuleClasses;
    toggleRow: (index: number) => void;
    hasIndex: (index: number) => void;

};

const Sidebar: Component<Props> = (props) => {
    const stylin = useStyle();
    let dndSrdRaces = props.dndSrdRaces;
    let styles = props.styles;
    let toggleRow = props.toggleRow;
    let hasIndex = props.hasIndex;

    return (
        <div class={`${stylin.accent} ${styles.fixed}`}> {/* sidebar  */}
        <For each={dndSrdRaces()}>
          {(race, i) => (
            <div class={`${styles.sidebar}`}>
              <div class={`${styles.flexrow}`}>
                <span onClick={() => toggleRow(i())}><Banner styles={styles} /></span> <span>{race.name}</span>
                <br />
              </div>
              <Show when={hasIndex(i())}> {/** shown when the flag is clicked */}
                <div class={`${styles.sidebar_shown}`}>
                  <Show when={race.subRaces.length > 0}>
                    <button>subraces</button> {/** aaaaand here */}
                  </Show>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    )
};
export default Sidebar;