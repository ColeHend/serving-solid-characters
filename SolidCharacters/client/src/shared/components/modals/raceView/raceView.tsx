import { Accessor, Component, createMemo, createSignal, For, Setter, Show, useContext } from "solid-js";
// import { Race } from "../../../../models";
import { AbilityScores, PrerequisiteType, Race } from "../../../../models/generated";
import styles from "./raceView.module.scss";
import { SharedHookContext } from "../../../../components/rootApp";
import { Modal, TabBar, TextArea } from "coles-solid-library";
import { useDnDSubraces } from "../../../customHooks/dndInfo/info/all/subraces";
import Markdown from "../../MarkDown/MarkDown";


interface props {
  currentRace: Accessor<Race>;
  backClick: [Accessor<boolean>,Setter<boolean>];
  width?:string;
  height?: string;
}

const RaceView: Component<props> = (props) => {
  const race = props.currentRace;
  const allSubraces = useDnDSubraces();

  // console.log("subraces:",allSubraces());

  const currentSubraces = createMemo(()=>allSubraces().filter(sr=> sr.parentRace === race().id));

  const [activeTab, setActiveTab] = createSignal<number>(0);

  const currentSubraceNames = createMemo(()=>currentSubraces().flatMap(x=>x.name));


  const getDescription = (descriptions: any ) => {
    const keys = Object.keys(descriptions);

    const descArr:string[] = [];

    keys.forEach((key) => {
      descArr.push(descriptions[key]);  
    })

    if (descArr.length === 0) return [];

    return descArr;
  }

  return <Modal title={race().name} show={props.backClick}>
    <div class={`${styles.raceWrapper}`}>
      <h1 class={`${styles.header}`}>{race().name}</h1>

      <Show when={race().descriptions}>
        <div class={`${styles.info}`}><Markdown text={getDescription(race().descriptions).join(" ")} /></div>
      </Show>
        
      <div class={`${styles.flexBoxRow}`}>
        <div class={`${styles.flexBoxColumn}`}>
          <Show when={race().abilityBonuses.length !== 0}>
            <h3 class={`${styles.header}`}>Ability Score Increases: </h3>
            
            <div class={`${styles.startingProfsRow}`}>
              <For each={race().abilityBonuses}>
                {(bonus) => <span class={`${styles.info}`}>
                  <span>{AbilityScores[`${bonus.stat}`]}</span> by <span>{bonus.value}</span>   
                </span>}
              </For>
            </div>
          </Show>
    
          <h3 class={`${styles.header}`}>Speed:</h3>
    
          <span class={`${styles.info}`}>{race()?.speed}ft</span>

        </div>
        <div class={`${styles.flexBoxColumn}`}>
          <Show when={!!race()?.size}>
            <h3 class={`${styles.header}`}>Size:</h3>
            <span class={`${styles.info}`}>{race()?.size}</span>
          </Show>

          <h3 class={`${styles.header}`}>Languages:</h3>
            
          <span class={`${styles.info}`}>{race()?.languages.join(", ")}</span>

        </div>
      </div>      


      <Show when={race().traits.length > 0}>
        <TabBar 
          tabs={["Features",...currentSubraceNames()]}
          activeTab={activeTab()}
          onTabChange={(label,index)=>setActiveTab(index)}
          colors={{
            indicator: "#AA0505"
          }}
        />
      </Show>

      <Show when={activeTab() === 0}>
        <span>
          <For each={race()?.traits}>
            {(trait) =><div>
              <h3 class={`${styles.header} ${styles.leftAlignHeader}`}>{trait?.details.name}:{" "}</h3>
              <For each={trait?.prerequisites}>
                {(value) => <span class={`${styles.info}`}>{value.value}</span>}
              </For>

              <div class={`${styles.info} ${styles.leftAlignInfo}`}><Markdown text={trait.details.description}/></div>
            </div>}
          </For>
        </span>
      </Show>

      <For each={currentSubraces()}>
        {(subRace,i) => <Show when={activeTab() === currentSubraces().indexOf(subRace) + 1}>


            <span class={`${styles.info}`}>{getDescription(subRace.descriptions)}</span>

            <div class={`${styles.flexBoxRow}`}>
              <div class={`${styles.flexBoxColumn}`}>
                <Show when={subRace.abilityBonuses.length > 0}>
                  <h3 class={`${styles.header}`}>Ability Score Increases</h3>

                  <div class={`${styles.startingProfsRow}`}>
                    <For each={subRace.abilityBonuses}>
                      {(score) => <span class={`${styles.info}`}>
                        <span>{ AbilityScores[score.stat] }</span> by <span>{ score.value }</span>  
                      </span>}
                    </For>
                  </div>

                </Show>

                <h3 class={`${styles.header}`}>Speed: </h3>

                <span class={`${styles.info}`}>{ subRace.speed }ft</span>
              </div>
              <div class={`${styles.flexBoxColumn}`}>
                <h3 class={`${styles.header}`}>Size:</h3>

                <span class={`${styles.info}`}>{ subRace.size }</span>

                <Show when={subRace.languages.length > 0}>
                  <h3 class={`${styles.header}`}>Languages:</h3>

                  <span class={`${styles.info}`}>{ subRace.languages.join(", ") }</span>
                </Show>
              </div>
            </div>

            <div class={`${styles.flexBoxColumn}`}>
              <For each={subRace.traits}>
                {(trait)=><div>
                  <h3 class={`${styles.header} ${styles.leftAlignHeader}`}>{trait.details.name}</h3>
                  
                  <div class={`${styles.flexBoxRow}`}>
                    <For each={trait.prerequisites}>
                      {(prerequisite)=><div>
                        {PrerequisiteType[prerequisite.type]} {prerequisite.value}
                      </div>}
                    </For>
                  </div>

                  <span class={`${styles.info} ${styles.leftAlignInfo}`}><Markdown text={trait.details.description} /></span>  
                </div>}
              </For>
            </div>
        </Show>}
      </For>
    </div>
  </Modal>
};

export default RaceView;
