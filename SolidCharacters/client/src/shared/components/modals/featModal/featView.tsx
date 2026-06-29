import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, Setter, Show, Switch } from "solid-js";
import { Feat, PrerequisiteType } from "../../../../models/generated";
import style from "./featView.module.scss";
import { Modal } from "coles-solid-library";
import Markdown from "../../MarkDown/MarkDown";
import { DndDialogHeader } from "../../dndDialogHeader/dndDialogHeader";

interface props {
  feat: Accessor<Feat>;
  show: [Accessor<boolean>,Setter<boolean>];
  width:string;
  height:string;
}

const FeatView: Component<props> = (props) => {
  const currentFeat = props.feat;
  const [showMenu,setShowMenu] = props.show;

  const featDescription = createMemo(()=>currentFeat().details.description);

  const featPrereqTypes = createMemo(() => currentFeat().prerequisites.flatMap(x => PrerequisiteType[x.type]));
  

  const [menuRef, setMenuRef] = createSignal<HTMLElement|null>(null);

  createEffect(() => {
    const ref = menuRef();

    if (!ref) {

      return;
    }

    const firstParent = ref.parentElement;

    const second = firstParent?.parentElement;

    if (second) {
      second.style.paddingBottom = "0"
    }
  })

  return (
    <Modal 
      title={currentFeat()?.details.name} 
      show={[showMenu,setShowMenu]}
      noHeader>
      <div ref={setMenuRef} class={`${style.featWrapper}`}>
        <DndDialogHeader onClose={()=>{}}>
          <div class={`${style.styledHeader}`}> 
            <Show when={currentFeat().details.name.toLowerCase().includes("boon")}>
              <span>EPIC BOON </span>
            </Show>

            <span>FEAT</span>

            <h1>{currentFeat().details.name}</h1>
          </div>
        </DndDialogHeader>
        
        <div class={`${style.divider}`}></div>
        
        <div class={`${style.prerequisites}`}>
          <h2 class={`${style.nameHeader}`}>Prerequisites</h2>

          <span class={`${style.firstPrereq}`}>
            <Show when={currentFeat().prerequisites[0].type !== 0 || currentFeat().prerequisites[0].type !== 7}>
              <span>{PrerequisiteType[currentFeat().prerequisites[0].type]}</span>
            </Show>
            
            <span> {currentFeat().prerequisites[0].value}</span>
          </span>
        </div>

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