import { Accessor, Component, createEffect, createMemo, createSignal, For, Setter, Show } from "solid-js";
import { AbilityScores, Race } from "../../../../models/generated";
import styles from "./raceView.module.scss";
import { Modal } from "coles-solid-library";
import { useDnDSubraces } from "../../../customHooks/dndInfo/info/all/subraces";
import Markdown from "../../MarkDown/MarkDown";
import { Description } from "./description/description";
import { DndDialogHeader } from "../../dndDialogHeader/dndDialogHeader";
import { FlatCard } from "coles-solid-library";

interface props {
  currentRace: Accessor<Race>;
  backClick: [Accessor<boolean>,Setter<boolean>];
  width?:string;
  height?: string;
}

const RaceView: Component<props> = (props) => {
  const race = props.currentRace;
  const allSubraces = useDnDSubraces();

  const [, setShow] = props.backClick;

  const currentSubraces = createMemo(()=>allSubraces()?.filter(sr=> sr?.parentRace === race()?.id));

  const getDescription = (descriptions: Record<string, string> ) => {
    const keys = Object.keys(descriptions);

    const descArr:string[] = [];

    keys.forEach((key) => {
      if (key === "abilities") return;

      descArr?.push(descriptions?.[key]);  
    })

    if (descArr.length === 0) return [];

    return descArr;
  }

  const [menuRef, setMenuRef] = createSignal<HTMLElement|null>(null);

  createEffect(() => {
    const ref = menuRef();

    if (!ref) {

      return;
    }

    const firstParent = ref?.parentElement;

    const second = firstParent?.parentElement;

    if (second) {
      second.style.paddingBottom = "0"
    }
  })

  return <Modal title={race().name} noHeader show={props.backClick}>
    <div class={`${styles.raceWrapper}`} ref={setMenuRef}>
      <DndDialogHeader onClose={()=>setShow(old => !old)}>
        <div class={`${styles.styledHeader}`}>
          Species<Show when={race().legacy ?? false}><span class={`${styles.dot}`}>·</span>Legacy</Show>

          <h1>{race()?.name ?? ""}</h1>
        </div>
      </DndDialogHeader>

      <div class={`${styles.topDivider}`} />

      <Show when={race().descriptions}>
        <div class={`${styles.info} ${styles.description}`}>
          <Description text={getDescription(race().descriptions ?? {}).join(" ") ?? ""} />
        </div>
      </Show>

      <div class={`${styles.flexBoxRow}`}>
        <div class={`${styles.flexBoxColumn}`}>
          <h3 class={`${styles.header}`}>Ability Score Increase</h3>
          <Show when={race().abilityBonuses.length !== 0} fallback={<span class={`${styles.info}`}>{race()?.descriptions?.['abilities'] ?? ""}</span>}>
            
            <div class={`${styles.startingProfsRow}`}>
              <For each={race().abilityBonuses}>
                {(bonus) => <span class={`${styles.info}`}>
                  <span>{AbilityScores[`${bonus.stat}`]}</span> + <span>{bonus.value}</span>   
                </span>}
              </For>
            </div>
          </Show>

          <Show when={race()?.speed !== undefined && race()?.speed !== null}>
            <h3 class={`${styles.header}`}>Speed</h3>
            
            <div class={`${styles.info}`}>{race()?.speed}ft</div>
          </Show>
        </div>
        <div>
          <Show when={!!race()?.size}>
            <h3 class={`${styles.header}`}>Size</h3>
            <div class={`${styles.info}`}>{race()?.size}</div>
          </Show>

          <Show when={race()?.languages.length > 0}>
            <h3 class={`${styles.header}`}>Languages</h3>
              
            <div class={`${styles.info}`}>{race()?.languages.join(", ")}</div>
          </Show>
        </div>
      </div>      

      <h3 class={`${styles.coolLabel}`}>Features</h3>

      <span>
        <For each={race()?.traits}>
          {(trait) =><div>
            <h3 class={`${styles.header} ${styles.leftAlignHeader}`}>{trait?.details.name}</h3>
            <For each={trait?.prerequisites}>
              {(value) => <span class={`${styles.info}`}>{value.value}</span>}
            </For>

            <div class={`${styles.info} ${styles.leftAlignInfo}`}><Markdown text={trait.details.description}/></div>
          </div>}
        </For>
      </span>

      <Show when={currentSubraces().length > 0}>
        <h3 class={`${styles.coolLabel}`}>Subraces</h3>
        
        <div class={`${styles.subraceContainer}`}>
          <For each={currentSubraces()}>
            {(subRace,i) => <FlatCard 
                hideBottomBorder={
                  currentSubraces().length > 1 && i() !== currentSubraces().length - 1
                } 
                header={<span class={`${styles.header}`}>
                  {subRace?.name ?? ''}
                </span>} 
                class={`${styles.subraceCard}`} 
                transparent
              >

                <div class={`${styles.info} ${styles.leftAlignInfo}`}>
                  <Markdown text={getDescription(subRace.descriptions ?? {}).join(" ") ?? ""}/>
                </div>  
                
                <div class={`${styles.flexBoxRow}`}>
                  <div class={`${styles.flexBoxColumn}`}>
                    <h3 class={`${styles.header}`}>Ability Score Increase</h3>
                    <Show when={subRace.abilityBonuses.length !== 0} fallback={<span class={`${styles.info}`}>{subRace?.descriptions?.['abilities'] ?? ""}</span>}>
                      
                      <div class={`${styles.startingProfsRow}`}>
                        <For each={subRace.abilityBonuses}>
                          {(bonus) => <span class={`${styles.info}`}>
                            <span>{AbilityScores[`${bonus.stat}`]}</span> + <span>{bonus.value}</span>   
                          </span>}
                        </For>
                      </div>
                    </Show>

                    <Show when={subRace?.speed !== undefined && subRace?.speed !== null}>
                      <h3 class={`${styles.header}`}>Speed</h3>
                      
                      <div class={`${styles.info}`}>{subRace?.speed}ft</div>
                    </Show>
                  </div>
                  <div>
                    <Show when={!!subRace?.size}>
                      <h3 class={`${styles.header}`}>Size</h3>
                      <div class={`${styles.info}`}>{subRace?.size}</div>
                    </Show>

                    <Show when={subRace?.languages.length > 0}>
                      <h3 class={`${styles.header}`}>Languages</h3>
                        
                      <div class={`${styles.info}`}>{subRace?.languages.join(", ")}</div>
                    </Show>
                  </div>
                </div>      

                <h3 class={`${styles.coolLabel}`}>Features</h3>

                <span>
                  <For each={subRace?.traits}>
                    {(trait) =><div>
                      <h3 class={`${styles.header} ${styles.leftAlignHeader}`}>{trait?.details.name}</h3>
                      <For each={trait?.prerequisites}>
                        {(value) => <span class={`${styles.info}`}>{value.value}</span>}
                      </For>

                      <div class={`${styles.info} ${styles.leftAlignInfo}`}><Markdown text={trait.details.description}/></div>
                    </div>}
                  </For>
                </span>

            </FlatCard>}
          </For>
        </div>

      </Show>

    </div>
  </Modal>
};

export default RaceView;