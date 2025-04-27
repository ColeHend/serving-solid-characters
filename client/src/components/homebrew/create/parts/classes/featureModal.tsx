import { Button, FormGroup, Input, Modal, Select, Option, Checkbox } from "coles-solid-library";
import { Accessor, Component, createEffect, createSignal, Setter, Switch, Match, Show, For } from "solid-js";
import { ClassForm } from "./classes";
import { CharacterChange, CharacterChangeTypes, Choice, Feature, FeatureTypes } from "../../../../../models/old/core.model";
import { LevelEntity } from "../../../../../models/old/class.model";
import { Clone, TextArea } from "../../../../../shared";
import { FeatureDetail } from "../../../../../models/data";
interface FeatureModalProps {
  showAddFeature: Accessor<boolean>;
  setShowAddFeature: Setter<boolean>;
  selectedFeature: Accessor<string>;
  setSelectedFeature: Setter<string>;
  isEditChoice: Accessor<boolean>;
  selectedLevel: Accessor<number>;
  formGroup: FormGroup<ClassForm>;
  setChange: Setter<boolean>;
}
export const FeatureModal: Component<FeatureModalProps> = (props) => {
  createEffect(() => {
    if (!props.showAddFeature()) {
      props.setSelectedFeature('');
      // Clear form fields
      setName('');
      setDescription('');
    } else if (props.isEditChoice() && props.selectedFeature()) {
      // When editing, load the feature data
      const feature = props.formGroup.get('features')[props.selectedLevel()]?.find(f => f.name === props.selectedFeature());
      if (feature) {
        setName(feature.name);
        setDescription(typeof feature.description === 'string' ? feature.description : '');
      }
    }
  });
  // name Input
  const [name, setName] = createSignal<string>('');
  // description Input
  const [description, setDescription] = createSignal<string>('');
  // changes
  const [charChanges] = createSignal<CharacterChange[]>([]);
  // choices
  const [choices] = createSignal<Choice<string>[]>([]);
  // save button
  const save = () => {
    const feature = {} as FeatureDetail;
    feature.name = name();
    feature.description = description();
    feature.metadata = {
      // changes: charChanges(),
    };

    if (choices().length > 0) {
      // feature.choices = choices();
    };

    const features = props.formGroup.get('features')[props.selectedLevel()] ?? [];
    if (features.find(f => f.name === feature.name)) {
      const ind = features.findIndex(f => f.name === feature.name);
      features[ind] = feature;
      const allFeatures = props.formGroup.get('features');
      allFeatures[props.selectedLevel()] = features;
      props.formGroup.set('features', allFeatures);
    } else {
      const allFeatures = props.formGroup.get('features');
      allFeatures[props.selectedLevel()] = [...features, feature];
      props.formGroup.set('features', allFeatures);
    }
    props.setChange(old => !old);
    props.setShowAddFeature(false);

  }
  return (
    <Modal show={[props.showAddFeature, props.setShowAddFeature]} title={`${props.isEditChoice() ? 'Edit' : 'Add'} Feature`}>
      <div style={{ padding: '20px', display: 'flex', 'flex-direction': 'column', gap: '15px' }}>
        <div>
          <h3>Feature Name</h3>
          <Input
            value={name()}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Enter feature name"
          />
        </div>

        <div>
          <h3>Description</h3>
          <TextArea
            text={description}
            setText={setDescription}
            placeholder="Enter feature description"
          />
        </div>

        <div style={{ 'margin-top': '20px', display: 'flex', gap: '10px', 'justify-content': 'flex-end' }}>
          <Button onClick={() => props.setShowAddFeature(false)}>
            Cancel
          </Button>
          <Button onClick={save}>
            {props.isEditChoice() ? 'Update' : 'Save'} Feature
          </Button>
        </div>
      </div>
    </Modal>
  )
};

interface ChangeTypeMetadata {
  pretty: string;
}
interface CharChangesProps {
  show: Accessor<boolean>;
  setShow: Setter<boolean>;
  changes: CharacterChange[];
  setChanges: Setter<CharacterChange[]>;
};
export const CharacterChanges: Component<CharChangesProps> = (props) => {
  const [currentChange, setCurrentChange] = createSignal<CharacterChange>({ type: CharacterChangeTypes.AC } as CharacterChange);
  const CharChangeMap = new Map<CharacterChangeTypes, ChangeTypeMetadata>([
    [CharacterChangeTypes.AC, { pretty: 'AC' }],
    [CharacterChangeTypes.AbilityScore, { pretty: 'Ability Score' }],
    [CharacterChangeTypes.AttackRoll, { pretty: 'Attack Roll' }],
    [CharacterChangeTypes.HP, { pretty: 'HP' }],
    [CharacterChangeTypes.Initiative, { pretty: 'Initiative' }],
    [CharacterChangeTypes.Save, { pretty: 'Saving Throw' }],
    [CharacterChangeTypes.Speed, { pretty: 'Speed' }],
    [CharacterChangeTypes.Spell, { pretty: 'Spell' }],
    [CharacterChangeTypes.SpellSlot, { pretty: 'Spell Slot' }],
  ]);
  return <Modal show={[props.show, props.setShow]} title="Character Changes">
    <div>
      <h3>Change Type</h3>
      <Select value={currentChange().type} onChange={(e) => {
        setCurrentChange((old)=>({ ...old, type: e }));
      }}>
        <For each={Array.from(CharChangeMap.entries())}>
          {([key, value]) => (
            <Option value={key}>{value.pretty}</Option>
          )}
        </For>
      </Select>
    </div>
  </Modal>
};
