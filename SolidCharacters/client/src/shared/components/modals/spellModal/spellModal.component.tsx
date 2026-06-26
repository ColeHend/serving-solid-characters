import { Accessor, Component, createEffect, createMemo, createSignal, Setter, Show, splitProps, useContext } from "solid-js";
import { Spell } from "../../../../models/generated";
import getUserSettings from "../../../customHooks/userSettings";
import { SharedHookContext } from "../../../../components/rootApp";
import { useUserStyles } from "../../../customHooks/utility/style/styleHook";
import style from "./spellModal.module.scss";
import { spellLevel, spellComponents } from "../../../customHooks/utility/tools/Tools";
import { Modal } from "coles-solid-library";
import Markdown from "../../MarkDown/MarkDown";
import { DndDialogButton } from "../../dndDialogButton/dndDialogButton";
import { DndDialogHeader } from "../../dndDialogHeader/dndDialogHeader";
import { FleuronDivider } from "../../fleuronDivider/fleuronDivider";

type props = {
  spell: Accessor<Spell>;
  backgroundClick: [Accessor<boolean>, Setter<boolean>];
};

const SpellModal: Component<props> = (props) => {
  
  const sharedHooks = useContext(SharedHookContext);
  const [{"0":showSpell, "1":setShowSpell}, other] = splitProps(props.backgroundClick, ["0","1"]);

  const [menuRef, setMenuRef] = createSignal<HTMLElement|null>(null)

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
      title={props.spell().name}
      show={[showSpell,setShowSpell]}
      noHeader
    >
      <div class={`${style.view}`} ref={setMenuRef}>
        {/* <h1>{props.spell().name}</h1> */}

        <DndDialogHeader onClose={()=>{}}>
          <div class={`${style.dndStyledHeader}`}>
            level {props.spell().level} spell · {props.spell().school}
            <h1>{props.spell().name}</h1>
          </div>
        </DndDialogHeader>

        <h2 class={`${style.spellSchoolTitle}`}>
          <span class={`${style.flavor}`}>
            {spellLevel(+props.spell().level)}-level {props.spell().school}
          </span>
        </h2>

        <div class={`${style.spellInfo}`}>
          <h2>Casting time: </h2>
          <span>
            {props.spell().castingTime}  
          </span>

          <Show when={props.spell().range !== ""}>
            <h2>Range: </h2>
            <span>
              {props.spell().range}
            </span>
          </Show>

          <h2>Components: </h2>
          <span>
            {spellComponents(props.spell())}
          </span>

          <Show when={props.spell().duration !== ""}>
            <h2>Duration: </h2>
            <span>
              {props.spell().duration}
            </span>
          </Show>

          <Show when={props.spell().classes.length !== 0}>
            <h2>Classes: </h2>
            <span>{props.spell().classes.join(", ")}</span>
          </Show>

          <Show when={props.spell().subClasses.length > 0}>
            <h2>SubClasses: </h2>
            <span>{props.spell().subClasses.join(", ")}</span>
          </Show>
        </div>


        <FleuronDivider />

        <span>
          <Markdown 
            text={props.spell().description}
            class={`${style.desc}`}
          />
        </span>

        <Show when={!!props.spell()?.higherLevel}>
          <h2>Higher Levels</h2>
          
          <span>
            <Markdown
              text={props.spell().higherLevel ?? ""}
            />
          </span>
        </Show>

      </div>
    </Modal>

  );
};
export default SpellModal