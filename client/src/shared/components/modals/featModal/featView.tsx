import { Accessor, Component, For, Match, Setter, Switch } from "solid-js";
// import Modal from "../../popup/popup.component";
import { Feat } from "../../../../models";
import { FeatureTypes as PreReqType } from "../../../../models/old/core.model";
import style from "./featView.module.scss";
import { Modal } from "coles-solid-library";

interface props {
  feat: Accessor<Feat>;
  show: [Accessor<boolean>,Setter<boolean>];
  width:string;
  height:string;
}

const FeatView: Component<props> = (props) => {
  const currentFeat = props.feat;
  const [showMenu,setShowMenu] = props.show;

  return (
    <Modal 
      title={currentFeat()?.name} 
      show={[showMenu,setShowMenu]}
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