import { Accessor, Component, createSignal, For, Setter, Show, useContext } from "solid-js";
// import { Race } from "../../../../models";
import { AbilityScores, Race } from "../../../../models/data";
import styles from "./raceView.module.scss";
import { SharedHookContext } from "../../../../components/rootApp";
import { Modal, TabBar } from "coles-solid-library";


interface props {
  currentRace: Accessor<Race>;
  backClick: [Accessor<boolean>,Setter<boolean>];
  width?:string;
  height?: string;
}

const RaceView: Component<props> = (props) => {
  const race = props.currentRace;
  const sharedHooks = useContext(SharedHookContext);

  const [activeTab, setActiveTab] = createSignal<number>(0);

  // const subraceNames = race()..flatMap((subrace) => subrace.name);

  return <Modal title={race().name} show={props.backClick}>
    <div class={`${styles.raceWrapper}`}>
      <h1 class={`${styles.header}`}>{race().name}</h1>

      <Show when={race().descriptions}>
        <div class={`${styles.info}`}>{race().descriptions?.physical}</div>

        <div class={`${styles.info}`}>{race().descriptions?.abilities}</div>
      </Show>
        
      

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

      <Show when={race().traits.length > 0}>
        <h3 class={`${styles.header}`}>Race Specific Traits:</h3>

        <span>
          <For each={race()?.traits}>
            {(trait) =><div>
              <h3 class={`${styles.header}`}>{trait?.details.name}:{" "}</h3>
              <For each={trait?.prerequisites}>
                {(value) => <span class={`${styles.info}`}>{value.value}</span>}
              </For>

              <div class={`${styles.info}`}>{trait.details.description}</div>
            </div>}
          </For>
        </span>
      </Show>

      <h3 class={`${styles.header}`}>Languages:</h3>
        
      <span class={`${styles.info}`}>{race()?.languages.join(", ")}</span>


      {/* <Show when={race()..length > 0}>
        <div class={`${styles.subclassesTabRow}`}>
            <TabBar tabs={subraceNames} activeTab={activeTab()} onTabChange={(label, index)=> setActiveTab(index)} colors={{
              indicator: "#AA0505"
            }} />

            <For each={race().subRaces}>
              {
                (subrace, i) => <Show when={i()}>
                  <h3 class={`${styles.header}`}>Description</h3>
                <span>{subrace.desc}</span>
                <h3 class={`${styles.header}`}>Ability Score Increases: </h3>
                <For each={subrace.abilityBonuses}>
                  { (abilityIncrease, i) => <>
                    <span>{abilityIncrease.name}</span> by <span>{abilityIncrease.value}</span>
                  </>

                  }
                </For>
                    
                <Show when={subrace.traits.length > 0}>
                  <For each={subrace.traits}>
                    { (trait, i) => <>
                      <h3 class={`${styles.header}`}>{trait.name}: </h3><span class={`${styles.info}`}>{trait.value}</span>
                    </>

                    }
                  </For>
                </Show>

                <Show when={!!subrace.startingProficencies && subrace.startingProficencies.length > 0}>
                  <h3 class={`${styles.header}`}>Proficences: </h3>
                  <span class={`${styles.info}`}>{subrace.startingProficencies?.map(x=>x.value).join(", ")}</span>  
                </Show>

                <Show when={subrace.languages.length > 0}>
                  <h3 class={`${styles.header}`}>extra languages: </h3>
                  <span class={`${styles.info}`}>{subrace.languages.join(", ")}</span>

                </Show>

                </Show> 
              }
            </For>

        </div>
      </Show> */}

    </div>
  </Modal>
};

export default RaceView;
