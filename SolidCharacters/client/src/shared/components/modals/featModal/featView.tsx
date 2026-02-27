import { Accessor, Component, createMemo, For, Match, Setter, Show, Switch } from "solid-js";
import { Feat, PrerequisiteType } from "../../../../models/generated";
import style from "./featView.module.scss";
import { Modal } from "coles-solid-library";
import Markdown from "../../MarkDown/MarkDown";

interface props {
  feat: Accessor<Feat>;
  show: [Accessor<boolean>,Setter<boolean>];
  width:string;
  height:string;
}

const FeatView: Component<props> = (props) => {
  const currentFeat = props.feat;
  const [showMenu,setShowMenu] = props.show;

  const featDescription = createMemo(()=>currentFeat().details.description)

  return (
    <Modal 
      title={currentFeat()?.details.name} 
      show={[showMenu,setShowMenu]}>

      <div class={`${style.featWrapper}`}>
        {/* <h1 class={`${style.nameHeader}`}>{currentFeat().details.name}</h1> */}
        <h2 class={`${style.nameHeader} ${style.flexHeader}`}>Prerequisites: 
          <span class={`${style.preRequisites}`}>
            <For each={currentFeat().prerequisites}>
              {(preReq, i) => <span class={`${style.smallerText}`}>
                <Show when={preReq.type !== 7}>
                  <Show when={preReq.type !== 0}>
                    <span>{PrerequisiteType[`${preReq.type}`]} </span>
                  </Show>
                </Show>
                {preReq.value} 

                <Show when={i() !== currentFeat().prerequisites.length - 1 }>
                  , 
                </Show>
              </span>}
            </For>
          </span>
        </h2>

        <div class={`${style.description}`}>
            <Markdown 
              text={featDescription()}
            />
        </div>
      </div>
    </Modal>
  );
};
export default FeatView; 