import { Component, For, Show, createSignal } from "solid-js";
import { Race } from "../../../models/race.model";
import useStyle from "../../../customHooks/utility/style/styleHook";
import Banner from "./banner";
import { effect } from "solid-js/web";

type Props = {
    dndSrdRaces: () => Race[];
    styles: CSSModuleClasses;
    toggleRow: (index: number) => void;
    hasIndex: (index: number) => void;

};

const Sidebar: Component<Props> = (props) => {
    
    const [shown, setShown] = createSignal(false);
    const stylin = useStyle();
    let dndSrdRaces = props.dndSrdRaces;
    let styles = props.styles;
    let toggleRow = props.toggleRow;
    let hasIndex = props.hasIndex;

    
    const moveToElement = async (id: string) => {
      
      
      const element = document.getElementById(id) as HTMLElement;

      if (!!element) {
        
        element.scrollIntoView({ behavior: "smooth" });
        
      } else {
        console.log("element not found");
        console.log(` found : ${element}`);
        
        
      }
    }

    return (
      <>
          <Show when={shown() === true}>
            <div class={`${stylin.accent} ${styles.fixed}`}> {/* sidebar  */}
            <For each={dndSrdRaces()}>
              {(race, i) => (
                <div id="raceSideBar" class={`${styles.sidebar}`}>
                  <div class={`${styles.flexrow}`}>
                    <span onClick={() => toggleRow(i())}><Banner styles={styles} /></span> <span onClick={()=>moveToElement(race.name)}>{race.name}</span>
                    <br />
                  </div>
                  <Show when={hasIndex(i())}> {/** shown when the flag is clicked */}
                    <div class={`${styles.sidebar_shown}`}>
                      <Show when={race.subRaces.length > 0}>
                        <button onClick={()=>moveToElement(race.subRaces[0].name)}>subraces</button> {/** aaaaand here */}
                      </Show>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>

          </Show>
        <button class={`${styles.sideBarBtn}`} onClick={()=>setShown(!shown())}>→</button>
      </>
    )
};
export default Sidebar;