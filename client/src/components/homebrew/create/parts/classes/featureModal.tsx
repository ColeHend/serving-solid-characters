import { Button, FormGroup, Input, Modal } from "coles-solid-library";
import { Accessor, Component, createEffect, createSignal, Setter } from "solid-js";
import { ClassForm } from "./classes";
import { CharacterChange, Choice, Feature, FeatureTypes } from "../../../../../models/core.model";
import { LevelEntity } from "../../../../../models/class.model";
interface FeatureModalProps {
  showAddFeature: Accessor<boolean>;
  setShowAddFeature: Setter<boolean>;
  selectedFeature: Accessor<string>;
  setSelectedFeature: Setter<string>;
  isEditChoice: Accessor<boolean>;
  selectedLevel: Accessor<number>;
  setTableData: Setter<LevelEntity[]>;
  formGroup: FormGroup<ClassForm>;
}
export const FeatureModal: Component<FeatureModalProps> = (props)=>{
  createEffect(() => {
    if (!props.showAddFeature()) {
      props.setSelectedFeature('');
      // Clear form fields
      setName('');
      setDescription('');
    } else if (props.isEditChoice() && props.selectedFeature()) {
      // When editing, load the feature data
      const levels = props.formGroup.get('classLevels') as LevelEntity[];
      const level = levels.find(l => l.level === props.selectedLevel());
      if (level) {
        const feature = level.features.find(f => f.name === props.selectedFeature());
        if (feature) {
          setName(feature.name);
          setDescription(typeof feature.value === 'string' ? feature.value : '');
        }
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
    const feature = {} as Feature<string, string>;
    feature.name = name();
    feature.value = description();
    feature.metadata = {
      changes: charChanges(),
    };
    feature.info = {
      className: props.formGroup.get('name') as string,
      subclassName: '',
      level: props.selectedLevel(),
      type: FeatureTypes.Class,
      other: '',
    };
    if (choices().length > 0) {
      feature.choices = choices();
    };
    
    const levels = props.formGroup.get('classLevels') as LevelEntity[];
    const level = levels.find(l => l.level === props.selectedLevel())!;
    
    if (props.isEditChoice() && props.selectedFeature()) {
      // Update existing feature
      const featureIndex = level.features.findIndex(f => f.name === props.selectedFeature());
      if (featureIndex !== -1) {
        level.features[featureIndex] = feature;
      }
    } else {
      // Add new feature
      level?.features.push(feature);
    }
    
    props.setTableData([...levels.map(l => l.level === level?.level ? level : l)]);
    props.setShowAddFeature(false);
    
  }
  return (
    <Modal show={[props.showAddFeature, props.setShowAddFeature]} title={`${props.isEditChoice()? 'Edit': 'Add'} Feature`}>
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
          <Input
            value={description()}
            onChange={(e) => setDescription(e.currentTarget.value)}
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
}