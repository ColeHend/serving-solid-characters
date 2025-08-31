import { FormField, Input, TextArea, FormGroup } from "coles-solid-library";
import styles from './subclasses.module.scss';

interface CoreFieldsProps<T extends { name: string; description: string }> {
  form: FormGroup<T>;
  updateParamsIfReady: () => void;
}

export const CoreFields = <T extends { name: string; description: string }>(p: CoreFieldsProps<T>) => (
  <div style={{ display: "flex", "flex-direction": "column" }}>
    <FormField name="Subclass Name" formName="name">
      <Input
        transparent
        value={(p.form.get('name') as any) || ''}
        onChange={e => {
          p.form.set('name', e.currentTarget.value as any);
          p.updateParamsIfReady();
        }}
      />
    </FormField>
    <FormField class={`${styles.textArea}`} name="Subclass Description" formName="description">
      <TextArea
        placeholder="Enter a Subclass description.."
        text={() => (p.form.get('description') as any) || ''}
        setText={v => p.form.set('description', v as any)}
        value={(p.form.get('description') as any) || ''}
        transparent
        onChange={e => p.form.set('description', e.currentTarget.value as any)}
      />
    </FormField>
  </div>
);
