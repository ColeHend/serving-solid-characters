import { Component, createSignal } from "solid-js";
import styles from "./classes.module.scss";
import { FieldError, FormField, Input, TextArea } from "coles-solid-library";

export const Header: Component = () => {
  const [desc, setDesc] = createSignal<string>("");
  return (
    <div class={`${styles.header}`}>
      <div class={`${styles.fieldSizeLg}`}>
        <FormField name="Class Name" formName="name">
          <Input type="text" />
          <FieldError errorName="required">Name Is Required</FieldError>
        </FormField>
      </div>
      <div class={`${styles.fieldSizeXl}`}>
        <FormField name="Class Description" formName="description">
          <TextArea text={desc} setText={setDesc} />
        </FormField>
      </div>
    </div>
  );
};