import { Component, For, Match, Switch } from "solid-js";
import { Select, Option, Input, FormField, Button, Chip } from "coles-solid-library";
import { PrerequisiteType } from "../../../../../models/generated/SolidCharacters.Domain.DTO.Updated";
import type { FeatsFormStore } from "./useHomeFeats";
import styles from "./feats.module.scss";

interface Props {
  store: FeatsFormStore;
}

export const PrerequisiteSelector: Component<Props> = (props) => {
  const s = props.store;

  return (
    <div class={styles.preRequisites}>
      <h2>Add Pre-Requisites</h2>
      <div>
        <Select
          value={s.selectedType()}
          onChange={(e) => s.setSelectedType(() => +e as PrerequisiteType)}
          class={styles.colorTransparent}
          transparent
        >
          <Option value={PrerequisiteType.Stat}>Ability Score</Option>
          <Option value={PrerequisiteType.Class}>Class</Option>
          <Option value={PrerequisiteType.Level}>Class Level</Option>
          <Option value={PrerequisiteType.Subclass}>Subclass</Option>
          <Option value={PrerequisiteType.Feat}>Feat</Option>
          <Option value={PrerequisiteType.Race}>Race</Option>
          <Option value={PrerequisiteType.Item}>Item</Option>
          <Option value={PrerequisiteType.String}>Other / Text</Option>
        </Select>
        <Switch>
          <Match when={s.selectedType() === PrerequisiteType.Stat}>
            <div>
              <Select transparent value={s.keyName()} onChange={(e) => s.setKeyName(e)} class={styles.colorTransparent}>
                <Option value="STR">Strength</Option>
                <Option value="DEX">Dexterity</Option>
                <Option value="CON">Constitution</Option>
                <Option value="INT">Intelligence</Option>
                <Option value="WIS">Wisdom</Option>
                <Option value="CHA">Charisma</Option>
              </Select>
              <FormField name="Amount">
                <Input
                  transparent
                  type="number"
                  value={s.keyValue()}
                  onChange={(e) => s.setKeyValue(e.currentTarget.value)}
                />
              </FormField>
            </div>
          </Match>
          <Match when={s.selectedType() === PrerequisiteType.Class}>
            <div>
              <Select
                transparent
                value={s.keyName()}
                class={styles.colorTransparent}
                onChange={(e) => {
                  s.setKeyName("Class");
                  s.setKeyValue(e);
                }}
              >
                <For each={s.classes()}>
                  {(classObj) => <Option value={classObj.name}>{classObj.name}</Option>}
                </For>
              </Select>
              <FormField name="Level (optional)">
                <Input
                  id="classLevelInput"
                  type="number"
                  min="1"
                  value={s.classLevel()}
                  placeholder="Any level"
                  onChange={(e) => s.setClassLevel(e.currentTarget.value)}
                  transparent
                />
              </FormField>
            </div>
          </Match>
          <Match when={s.selectedType() === PrerequisiteType.Level}>
            <div>
              <FormField name="Level">
                <Input
                  type="number"
                  min="1"
                  value={s.keyValue()}
                  onChange={(e) => s.setKeyValue(e.currentTarget.value)}
                />
              </FormField>
            </div>
          </Match>
          <Match when={s.selectedType() === PrerequisiteType.Subclass}>
            <div>
              <Select
                transparent
                value={s.keyValue()}
                class={styles.colorTransparent}
                onChange={(e) => s.setKeyValue(e)}
              >
                <For each={s.subclasses()}>
                  {(sc) => <Option value={`${sc.parentClass}:${sc.name}`}>{sc.parentClass} / {sc.name}</Option>}
                </For>
              </Select>
            </div>
          </Match>
          <Match when={s.selectedType() === PrerequisiteType.Feat}>
            <div>
              <Select
                transparent
                value={s.keyValue()}
                onChange={(e) => s.setKeyValue(e)}
                class={styles.colorTransparent}
              >
                <For each={s.feats()}>{(f) => {
                  const nm = (f as any).details?.name || (f as any).name;
                  return <Option value={nm}>{nm}</Option>;
                }}</For>
              </Select>
            </div>
          </Match>
          <Match when={s.selectedType() === PrerequisiteType.Race}>
            <div>
              <Select
                transparent
                value={s.keyValue()}
                onChange={(e) => s.setKeyValue(e)}
                class={styles.colorTransparent}
              >
                <For each={s.races()}>
                  {(r) => <Option value={(r as any).name}>{(r as any).name}</Option>}
                </For>
              </Select>
            </div>
          </Match>
          <Match when={s.selectedType() === PrerequisiteType.Item}>
            <div>
              <Select
                transparent
                value={s.keyValue()}
                onChange={(e) => s.setKeyValue(e)}
                class={styles.colorTransparent}
              >
                <For each={s.items()}>
                  {(it) => <Option value={(it as any).name}>{(it as any).name}</Option>}
                </For>
              </Select>
            </div>
          </Match>
          <Match when={s.selectedType() === PrerequisiteType.String}>
            <div>
              <FormField name="Text">
                <Input
                  type="text"
                  value={s.keyValue()}
                  onChange={(e) => s.setKeyValue(e.currentTarget.value)}
                  placeholder="Enter prerequisite text"
                  transparent
                />
              </FormField>
            </div>
          </Match>
        </Switch>
        <Button disabled={s.prerequisites().length >= 10} onClick={s.addPreReq}>
          Add
        </Button>
      </div>
      <div class={styles.chipBar}>
        <For each={s.prerequisites()}>
          {(pre, i) => (
            <Chip
              key={`${PrerequisiteType[pre.type]}`}
              value={pre.value}
              remove={() => s.removePreReq(i())}
            />
          )}
        </For>
      </div>
    </div>
  );
};
