import { Accessor, Component, For, Setter } from "solid-js";
import { Race } from "../../../../models";
import Modal from "../../popup/popup.component";

interface props {
  currentRace: Accessor<Race>;
  backClick: [Accessor<boolean>,Setter<boolean>];
}

const RaceView: Component<props> = (props) => {
  const race = props.currentRace;

  return <Modal title={race().name} backgroundClick={props.backClick}>
      <div>
        <h1 id={`${race().name}`}>{race().name}</h1>

        <h2>{race().name} traits</h2>
        <div>
          <h3>Ability Score Increases: </h3>
          <div >
            <For each={race().abilityBonuses}>
              {(bonus) => (
                <>
                  <br />
                  <span>{bonus.name}</span> <span>{bonus.value}</span>
                  <br />
                </>
              )}
            </For>
          </div>

          <h3>Age:</h3>

          <span >{race()?.age}</span>

          <h3>Alignment:</h3>

          <span >{race()?.alignment}</span>

          <h3>Size:</h3>

          <span>{race()?.sizeDescription}</span>

          <h3>Speed:</h3>

          <span>{race()?.speed}ft</span>

          <h3>Race Specific Traits:</h3>

          <span>
            {/* {race.traits} */}
            <For each={race()?.traits}>
              {(trait) => (
                <>
                  <div>
                    {trait?.name}:{" "}
                    <For each={trait?.value}>
                      {(value) => <span>{value}</span>}
                    </For>
                  </div>
                  <br />
                </>
              )}
            </For>
          </span>
          <h3>Proficiencies</h3>

          <div>
            {race()
              ?.startingProficencies?.map((x) => x?.value)
              ?.join("\n")}
          </div>

          <h3>Languages:</h3>

          {race()?.languageDesc}

        </div>
      </div>
    </Modal>
};

export default RaceView;
