import { Accessor, Component, For, Setter, Show, useContext } from "solid-js";
import { Race } from "../../../../models";
// import Modal from "../../popup/popup.component";
import styles from "./raceView.module.scss";
import Tabs, { Tab } from "../../Tabs/tabs";
import { SharedHookContext } from "../../../../components/rootApp";
import { Modal } from "coles-solid-library";


interface props {
  currentRace: Accessor<Race>;
  backClick: [Accessor<boolean>,Setter<boolean>];
  width?:string;
  height?: string;
}

const RaceView: Component<props> = (props) => {
  const race = props.currentRace;
  const sharedHooks = useContext(SharedHookContext);

  return <Modal title={race().name} show={props.backClick} height={sharedHooks.isMobile()?"":props.height} width={sharedHooks.isMobile()?"": props.width}>
    <div class={`${styles.raceWrapper}`}>
      <h1 class={`${styles.header}`}>{race().name}</h1>

      <h3 class={`${styles.header}`}>Ability Score Increases: </h3>
          
      <div class={`${styles.startingProfsRow}`}>
        <For each={race().abilityBonuses}>
          {(bonus) => <span class={`${styles.info}`}>
            <span>{bonus.name}</span> by <span>{bonus.value}</span>   
          </span>}
        </For>

      </div>

      <h3 class={`${styles.header}`}>Age:</h3>

      <span class={`${styles.info}`}>{race()?.age}</span>

      <h3 class={`${styles.header}`}>Alignment:</h3>

      <span class={`${styles.info}`}>{race()?.alignment}</span>

      <h3 class={`${styles.header}`}>Size:</h3>

      <span class={`${styles.info}`}>{race()?.sizeDescription}</span>

      <h3 class={`${styles.header}`}>Speed:</h3>

      <span class={`${styles.info}`}>{race()?.speed}ft</span>

      <Show when={race().traits.length > 0}>
        <h3 class={`${styles.header}`}>Race Specific Traits:</h3>

        <span>
          <For each={race()?.traits}>
            {(trait) =><div>
              <h3 class={`${styles.header}`}>{trait?.name}:{" "}</h3>
              <For each={trait?.value}>
                {(value) => <span class={`${styles.info}`}>{value}</span>}
              </For>
            </div>}
          </For>
        </span>
      </Show>
      <Show when={race().startingProficencies.length > 0}>
        <h3 class={`${styles.header}`}>Proficiencies:</h3>
        <span class={`${styles.info}`}>
          {race()
            ?.startingProficencies?.map((x) => x?.value)
            ?.join("\n")}
        </span>

      </Show>

      <h3 class={`${styles.header}`}>Languages:</h3>
        
      <span class={`${styles.info}`}>{race()?.languageDesc}</span>


      <Show when={race().subRaces.length > 0}>
        <div class={`${styles.subclassesTabRow}`}>
          <Tabs transparent>
            <For each={race().subRaces}>
              { (subrace, i) => <Tab name={subrace.name}>
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


              </Tab>}
            </For>
              
          </Tabs>
        </div>
      </Show>

    </div>
  </Modal>
};

export default RaceView;
