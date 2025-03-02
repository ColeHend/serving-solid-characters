import { Component, For, createSignal } from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from './create.module.scss';
import { Tab } from "../../navbar/navbar";

const HomebrewSidebar: Component = () => {
  const stylin = useStyle();
  const [homebrewTypes, setHombrewTypes] = createSignal<Tab[]>([]);

  setHombrewTypes([
    {Name: "Classes", Link: "/homebrew/create/classes"}, 
    {Name: "Subclasses", Link: "/homebrew/create/subclasses"}, 
    {Name: "Race", Link: "/homebrew/create/races"}, 
    {Name: "Backgrounds", Link: "/homebrew/create/backgrounds"}, 
    {Name: "Feats", Link: "/homebrew/create/feats"}, 
    {Name: "Spell", Link: "/homebrew/create/spells"}, 
    {Name: "Items", Link: "/homebrew/create/items"}
  ]);

  return (
    <div class={`${stylin.primary} ${styles.sidebar}`}>
      <ul>
        <For each={homebrewTypes()}>
          {(type) => (
            <li class={`${stylin.hover}`}>
              <a href={type.Link}>
                {type.Name}
              </a>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}

export default HomebrewSidebar;