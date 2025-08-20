import { Accessor, Component, For, Match, Setter, Switch } from "solid-js";
// import { Feat } from "../../../../models";
import { Feat } from "../../../../models/data";
import { FeatureTypes as PreReqType } from "../../../../models/old/core.model";
import style from "./featView.module.scss";
import { Modal } from "coles-solid-library";

interface props {
  feat: Accessor<Feat|undefined>;
  show: [Accessor<boolean>,Setter<boolean>];
  width:string;
  height:string;
}

const FeatView: Component<props> = (props) => {
  const currentFeat = props.feat;
  const [showMenu,setShowMenu] = props.show;

  return (
    <Modal 
      title={currentFeat()?.details.name || ""} 
      show={[showMenu,setShowMenu]}>

      <div class={`${style.featWrapper}`}>
        <h1 class={`${style.nameHeader}`}>{currentFeat()?.details.name}</h1>

        <div class={`${style.preRequisites}`}>
          <For each={currentFeat()?.prerequisites}>
            {(preReq) => (
              <div>
                {/* <Switch fallback={<div>Unknown requirement type</div>}>
                  <Match when={preReq.type === PreReqType.AbilityScore || preReq.info?.type.toString() === "AbilityScore"}>
                    <div>Ability Score Requirement:</div>
                    <span>
                      {preReq} of {preReq.value}
                    </span>
                  </Match>
                  <Match when={preReq.info?.type === PreReqType.Class || preReq.info?.type.toString() === "Class"}>
                    <div>Class Requirement:</div>
                    <span>
                      {preReq.value}
                    </span>
                  </Match>
                  <Match when={preReq.info?.type === PreReqType.CharacterLevel || preReq.info?.type.toString() === "CharacterLevel"}>
                    <div>Class Level Requirement:</div>
                    <span>
                      {preReq.name} {preReq.value}
                    </span>
                  </Match>
                  <Match when={preReq.info?.type === PreReqType.Classes || preReq.info?.type.toString() === "Classes"}>
                    <div>Classes Requirement:</div>
                    <span>
                      {preReq.name}
                    </span>
                  </Match>
                </Switch> */}
              </div>
            )}
          </For>
        </div>

        <div class={`${style.description}`}>
            {currentFeat()?.details.description}
        </div>
      </div>
    </Modal>
  );
};
export default FeatView;