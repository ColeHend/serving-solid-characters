import { Component, createMemo } from "solid-js";
import styles from "./create.module.scss";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { Body, Button, Form, FormField, FormGroup, Input, Validators } from "coles-solid-library";
import { Character, CharacterForm } from "../../../models/character.model";
import { FlatCard } from "../../../shared/components/flatCard/flatCard";

interface Person {
  name: string;
}

const CharacterCreate: Component = () => {
  // eslint-disable-next-line
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));
  const group = new FormGroup<CharacterForm>({
    "name": ["", [Validators.Required,Validators.minLength(3)]],
    "className": ["", []],
    "subclass": ["", []],
    "background": ["", []],
    "alignment": ["", []],
    "languages": [[], []]
  });

  // group.set('name', 'Bob');
  // const valid = group.validate();

  const handleSubmit = () => {
    
  }

  return (
    <Body class={`${stylin().accent} ${styles.mainBody}`}>
      <Form data={group} onSubmit={(d)=>{}}>
        <FlatCard icon="identity_platform" headerName="Identity" startOpen={true}>
          <FormField name="Name" formName="name">
            <Input />
          </FormField>
        </FlatCard>

        <FlatCard icon="save" headerName="save" alwaysOpen> 
          <Button>save</Button>
        </FlatCard>
      </Form>

    </Body>
  )
};

export default CharacterCreate;