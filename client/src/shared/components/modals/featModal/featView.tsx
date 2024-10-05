import { Accessor, Component, For, Match, Setter, Switch } from "solid-js";
import Modal from "../../popup/popup.component";
import { Feat } from "../../../../models";
import { FeatureTypes as PreReqType } from "../../../../models/core.model";
import style from "./featView.module.scss"

interface props {
  feat: Accessor<Feat>;
  backgroundClick: [Accessor<boolean>,Setter<boolean>];
  width:string;
  height:string;
}

const FeatView: Component<props> = (props) => {
  const currentFeat = props.feat;
  const [backClick,setBackClick] = props.backgroundClick;

  return (
    <Modal 
    title={currentFeat()?.name} 
    backgroundClick={[backClick,setBackClick]}
    width={props.width}
    height={props.height}>

      <div class={`${style.featWrapper}`}>
        <h1 class={`${style.nameHeader}`}>{currentFeat().name}</h1>

        <div class={`${style.preRequisites}`}>
          <For each={currentFeat().preReqs}>
            {(preReq) => (
              <div>
                <Switch>
                  <Match when={preReq.info.type === PreReqType.AbilityScore}>
                    <div>Ability Score Requirement:</div>
                    <span>
                      {/* this might change  */}
                      {preReq.name} of {preReq.value}
                    </span>
                  </Match>
                  <Match when={preReq.info.type === PreReqType.Class}>
                    <div>Class Requirement:</div>
                    <span>
                      {/* this might change  */}

                      {preReq.value}
                    </span>
                  </Match>
                  <Match when={preReq.info.type === PreReqType.CharacterLevel}>
                    <div>class level Requirement:</div>
                    <span>
                      {/* this might change  */}
                      {preReq.name} {preReq.value}
                    </span>
                  </Match>
                  <Match when={preReq.info.type === PreReqType.Classes}>
                    <div>classes Requirement:</div>
                    <span>
                      {/* this might change  */}

                      {preReq.name}
                    </span>
                  </Match>
                </Switch>
              </div>
            )}
          </For>
        </div>

        <div class={`${style.description}`}>

        </div>
      </div>
    </Modal>
  );
};
export default FeatView;