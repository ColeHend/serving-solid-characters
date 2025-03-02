import { Component, Accessor, Setter, For, Show, splitProps } from "solid-js"
import { CharacterChange, CharacterChangeTypes, MovementTypes, ChangeSubTypes, AbilityScores, TypeRestrictions } from "../../../../../../models/core.model";
import { ExpansionPanel, Select, Input, Button, Option, isNullish } from "../../../../../../shared";


interface Props {
	characterChanges: Accessor<CharacterChange[]>;
	setCharacterChanges: Setter<CharacterChange[]>;
	setSelectedChangeType: Setter<CharacterChangeTypes | undefined>;
	selectedChangeType: Accessor<CharacterChangeTypes | undefined>;
	selectedValue: Accessor<number | undefined>;
	setSelectedValue: Setter<number | undefined>;
	selectedSubType: Accessor<ChangeSubTypes | undefined>;
	setSelectedSubType: Setter<ChangeSubTypes | undefined>;
	selectedDieSize: Accessor<number | undefined>;
	setSelectedDieSize: Setter<number | undefined>;
	showOtherChangeType: Accessor<boolean | undefined>;
	selectedSet: Accessor<number | undefined>;
	setSelectedSet: Setter<number | undefined>;
	selectedStat: Accessor<AbilityScores | undefined>;
	setSelectedStat: Setter<AbilityScores | undefined>;
	selectedRestriction: Accessor<TypeRestrictions | undefined>;
	setSelectedRestriction: Setter<TypeRestrictions | undefined>;

}
const ChangeChanges:Component<Props> = (props) => {
  const characterChanges = props.characterChanges;
  const setCharacterChanges = props.setCharacterChanges;
  const setSelectedChangeType = props.setSelectedChangeType;
  const selectedChangeType = props.selectedChangeType;
  const selectedValue = props.selectedValue;
  const setSelectedValue = props.setSelectedValue;
  const selectedSubType = props.selectedSubType;
  const setSelectedSubType = props.setSelectedSubType;
  const selectedDieSize = props.selectedDieSize;
  const setSelectedDieSize = props.setSelectedDieSize;
  const showOtherChangeType = props.showOtherChangeType;
  const selectedSet = props.selectedSet;
  const setSelectedSet = props.setSelectedSet;
  const selectedStat = props.selectedStat;
  const setSelectedStat = props.setSelectedStat;
  const selectedRestriction = props.selectedRestriction;
  const setSelectedRestriction = props.setSelectedRestriction;

  const disableAddCharacterChange = () => {
    if (selectedChangeType() === undefined) return true;
    switch (selectedChangeType()) {
    case CharacterChangeTypes.Spell:
      return false;
    case CharacterChangeTypes.AbilityScore:
      return selectedSubType() === undefined;
    case CharacterChangeTypes.AC:
      return selectedSubType() === undefined;
    case CharacterChangeTypes.AttackRoll:
      return selectedSubType() === undefined;
    case CharacterChangeTypes.Initiative:
      return selectedSubType() === undefined;
    case CharacterChangeTypes.Save:
      return selectedSubType() === undefined;
    case CharacterChangeTypes.SpellSlot:
      return selectedSubType() === undefined;
    default:
      return selectedSubType() === undefined;
    }
  }


  return <div style={{ border: '1px solid', 'border-radius': '10px' }}>
    <div >
      <ExpansionPanel arrowSize={{ width: '35px', height: '35px' }} style={{ height: 'min-content' }}>
        <div>Character Changes</div>
        <div>
          <div>
            <label>Change Type</label>
            <Select transparent
              onChange={(e) => setSelectedChangeType(Number(e.currentTarget.value) as CharacterChangeTypes)}
              value={selectedChangeType()}
            >
              <For each={Object.keys(CharacterChangeTypes).filter((k) => !isNaN(Number(k)))}>{(changeType) => <>
                <Option value={changeType}>{CharacterChangeTypes[Number(changeType)]}</Option>
              </>}</For>
            </Select>
            <Show when={selectedChangeType() === CharacterChangeTypes.Speed}>
              <Select transparent
                onChange={(e) => setSelectedValue(Number(e.currentTarget.value))}
                value={selectedValue()}
              >
                <For each={Object.keys(MovementTypes).filter((k) => !isNaN(Number(k)))}>{(changeType) =>
                  <Option value={changeType}>{MovementTypes[Number(changeType)]}</Option>
                }</For>
              </Select>
            </Show>
          </div>
          <Show when={selectedChangeType() === CharacterChangeTypes.Spell}>
            <span>

            </span>
          </Show>
          <Show when={selectedChangeType() === CharacterChangeTypes.SpellSlot}>
            <span>

            </span>
          </Show>
          <Show when={showOtherChangeType()}>
            <div>
              <label>Sub Type</label>
              <Select transparent
                onChange={(e) => setSelectedSubType(Number(e.currentTarget.value) as ChangeSubTypes)}
                value={selectedSubType()}
              >
                <For each={Object.keys(ChangeSubTypes).filter((k) => !isNaN(Number(k)))}>{(changeType) => <>
                  <Option value={changeType}>{ChangeSubTypes[Number(changeType)]}</Option>
                </>}</For>
              </Select>
              <Show when={selectedSubType() === ChangeSubTypes.Die}>
                <Select transparent disableUnselected
                  onChange={(e) => setSelectedDieSize(Number(e.currentTarget.value))}
                  value={selectedDieSize()}
                >
                  <For each={[4, 6, 8, 10, 12, 20]}>{(dieSize) => <>
                    <Option value={dieSize}>d{dieSize}</Option>
                  </>}</For>
                </Select>
              </Show>
              <Show when={selectedSubType() === ChangeSubTypes.Set}>
                <Input type="number" transparent
                  value={selectedSet()}
                  onChange={(e) => setSelectedSet(Number(e.currentTarget.value))}
                  style={{
                    width: '75px',
                    'border-bottom': '1px solid',
                  }}
                />
              </Show>
              <Show when={selectedSubType() === ChangeSubTypes.Stat}>
                <Select transparent
                  onChange={(e) => setSelectedStat(Number(e.currentTarget.value))}
                  value={selectedStat()}
                >
                  <For each={Object.keys(AbilityScores).filter((k) => !isNaN(Number(k)))}>{(changeType) => <>
                    <Option value={changeType}>{AbilityScores[Number(changeType)]}</Option>
                  </>}</For>
                </Select>
              </Show>
              <Show when={selectedSubType() === ChangeSubTypes.SetAndDie}>
                <Input type="number" transparent
                  value={selectedSet()}
                  onInput={(e) => setSelectedSet(Number(e.currentTarget.value))}
                  style={{
                    width: '75px',
                    'border-bottom': '1px solid',
                  }}
                />
                <Select transparent disableUnselected
                  onChange={(e) => setSelectedDieSize(Number(e.currentTarget.value))}
                  value={selectedDieSize()}
                >
                  <For each={[4, 6, 8, 10, 12, 20]}>{(dieSize) => <>
                    <Option value={dieSize}>d{dieSize}</Option>
                  </>}</For>
                </Select>
              </Show>
            </div>
            <div>
              <label>Restriction</label>
              <Select transparent
                onChange={(e) => setSelectedRestriction(Number(e.currentTarget.value) as TypeRestrictions)}
                value={selectedRestriction()}
              >
                <For each={Object.keys(TypeRestrictions).filter((k) => !isNaN(Number(k)))}>{(changeType) => <>
                  <Option value={changeType}>{TypeRestrictions[Number(changeType)]}</Option>
                </>}</For>
              </Select>
            </div>
          </Show>
          <Button disabled={disableAddCharacterChange()}
            onClick={() => {
              let newChange: CharacterChange = {} as CharacterChange;
              const differentChangeTypes = [CharacterChangeTypes.UseNumber, CharacterChangeTypes.Spell, CharacterChangeTypes.SpellSlot, undefined];
              if (!differentChangeTypes.includes(selectedChangeType())) {
                if (selectedSubType() === ChangeSubTypes.Die) {
                  newChange = {
                    type: selectedChangeType()!,
                    subType: selectedSubType()!,
                    restriction: selectedRestriction(),
                    value: selectedDieSize()!,
                    dieSize: selectedDieSize()!,
                  };
                } else if (selectedSubType() === ChangeSubTypes.Set) {
                  newChange = {
                    type: selectedChangeType()!,
                    subType: selectedSubType()!,
                    restriction: selectedRestriction(),
                    value: selectedSet()!,
                  };
                } else if (selectedSubType() === ChangeSubTypes.Stat) {
                  newChange = {
                    type: selectedChangeType()!,
                    subType: selectedSubType()!,
                    restriction: selectedRestriction(),
                    value: selectedStat()!,
                  };
                } else if (selectedSubType() === ChangeSubTypes.SetAndDie) {
                  newChange = {
                    type: selectedChangeType()!,
                    subType: selectedSubType()!,
                    restriction: selectedRestriction(),
                    value: selectedSet()!,
                    dieSize: selectedDieSize()!,
                  };
                } else {
                  newChange = {
                    type: selectedChangeType()!,
                    subType: selectedSubType()!,
                    restriction: selectedRestriction(),
                    value: selectedValue()!,
                  };
                }
              } 
						
              if (!isNullish(newChange.type)) setCharacterChanges(old => [...old, newChange]);
            }}>Add</Button>
        </div>
      </ExpansionPanel>
      <div>
        <h4>Character Changes</h4>
        <div style={{
          width: '100%',
          display: 'flex',
          'flex-direction': 'row',
          'flex-wrap': 'wrap',
        }}>
          <For each={characterChanges()}>{(change) => <>
            <div style={{
              'border-right': '1px solid',
              'border-top': '1px solid',
              'border-radius': '10px',
              padding: '5px',
              margin: '5px',
              width: 'min-content',
            }}>
              <div>
                <Show when={change.subType === ChangeSubTypes.Die}>
								d{change.value} {CharacterChangeTypes[change.type]}
                </Show>
                <Show when={change.subType !== ChangeSubTypes.Die}>
                  {change.value} {CharacterChangeTypes[change.type]}
                </Show>
              </div>
              <div>
                {TypeRestrictions[change.restriction!]}
              </div>
              <Button onClick={() => setCharacterChanges([...characterChanges().filter((c) => c !== change)])}>Remove</Button>
            </div>
          </>}</For>
        </div>
      </div>
    </div>

  </div>
}


export default ChangeChanges;