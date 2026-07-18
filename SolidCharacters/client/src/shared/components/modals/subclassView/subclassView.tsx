import { Accessor, Component, createMemo, For, Setter, Show } from "solid-js";
import { Subclass } from "../../../../models/generated";
import { Modal } from "coles-solid-library";
import styles from "./subclassView.module.scss";
import Markdown from "../../MarkDown/MarkDown";
import { sourceLabel } from "../modals.shared";

interface props {
  subclass: Accessor<Subclass>;
  show: [Accessor<boolean>, Setter<boolean>];
}

/**
 * Standalone detail dialog for a single subclass, mirroring how ClassModal renders a
 * subclass tab (name → parent class → description → per-level features). Used to preview
 * a generated subclass that isn't attached to a saved parent class yet.
 */
const SubclassView: Component<props> = (props) => {
  const currentSubclass = props.subclass;
  const featureLevels = createMemo(() => Object.keys(currentSubclass().features ?? {}));

  return (
    <Modal title={currentSubclass().name} show={props.show}>
      <div class={`${styles.wrapper}`}>
        <Show when={currentSubclass().parentClass}>
          <h2 class={`${styles.subtitle}`}>Subclass · {currentSubclass().parentClass} · {sourceLabel(currentSubclass(), 'subclass')}</h2>
        </Show>

        <span>
          <Markdown text={currentSubclass().description} />
        </span>

        <Show when={featureLevels().length > 0}>
          <For each={featureLevels()}>
            {(level) => (
              <div class={`${styles.flexBoxColumn}`}>
                <h3>Level {level} Features:</h3>
                <For each={currentSubclass().features?.[+level]}>
                  {(feature) => (
                    <span class={`${styles.feature}`}>
                      <h4>{feature.name}</h4>
                      <span>
                        <Markdown text={feature.description} />
                      </span>
                    </span>
                  )}
                </For>
              </div>
            )}
          </For>
        </Show>
      </div>
    </Modal>
  );
};

export default SubclassView;
