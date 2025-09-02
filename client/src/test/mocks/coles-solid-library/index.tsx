/** @jsxImportSource solid-js */
// Minimal test stub for 'coles-solid-library'
import { JSX, Component, splitProps } from 'solid-js';

type AnyProps = { [k: string]: any } & { children?: any };

function passthrough(tag: string): Component<AnyProps> {
  return (all: AnyProps) => {
    const [local, rest] = splitProps(all, ['children']);
    return (
      <div data-mock={tag} {...rest}>
        {local.children}
      </div>
    );
  };
}

export const Body = passthrough('Body');
export const Button: Component<AnyProps> = (props) => <button data-mock="Button" {...props}>{props.children}</button>;
export const Container = passthrough('Container');
export const Icon = passthrough('Icon');
export const Table = passthrough('Table');
export const Column = passthrough('Column');
export const Row = passthrough('Row');
export const Cell = passthrough('Cell');
export const Header = passthrough('Header');
export const Menu = passthrough('Menu');
export const MenuItem = passthrough('MenuItem');
export const Carousel = passthrough('Carousel');
export const CarouselElement = passthrough('CarouselElement');
export const Chip: Component<AnyProps> = (p) => {
  const [local, rest] = splitProps(p, ['value','children','remove']);
  return (
    <div
      data-mock="Chip"
      data-value={local.value}
      {...rest}
    >{local.children || String(local.value || '')}</div>
  );
};
export const Chipbar = passthrough('Chipbar');
export const Modal = passthrough('Modal');
export const TabBar = passthrough('TabBar');
export const ExpansionPanel = passthrough('ExpansionPanel');
export const FormField = passthrough('FormField');
export const FieldError = passthrough('FieldError');
export const Checkbox: Component<AnyProps> = (p) => <input type="checkbox" data-mock="Checkbox" {...p} />;
export const Select: Component<AnyProps> = (p) => {
  const [local, rest] = splitProps(p, ['children', 'onChange', 'value']);
  return (
    <select
      data-mock="Select"
      value={local.value as any}
      onChange={(e) => local.onChange && local.onChange(e.currentTarget.value)}
      {...rest}
    >{local.children}</select>
  );
};
export const Option: Component<AnyProps> = (p) => <option data-mock="Option" value={p.value}>{p.children}</option>;
export const Input: Component<AnyProps> = (p) => <input data-mock="Input" {...p} />;
export const TextArea: Component<AnyProps> = (p) => {
  const [local, rest] = splitProps(p, ['text','setText','value']);
  const getter = typeof local.text === 'function' ? local.text as () => string : undefined;
  const set = typeof local.setText === 'function' ? local.setText as (v:string)=>void : undefined;
  return <textarea data-mock="TextArea" value={getter ? getter() : (local.value ?? '')} onInput={e => set && set(e.currentTarget.value)} {...rest}/>;
};

// Form utilities (very small mock)
type ControlConfig<T> = [T, any[]];
export class FormGroup<T extends Record<string, any>> {
  private store: Record<string, any> = {};
  constructor(schema: { [K in keyof T]: ControlConfig<T[K]> }) {
    Object.keys(schema).forEach(k => {
      // @ts-ignore
      this.store[k] = schema[k][0];
    });
  }
  get<K extends keyof T>(key: K): T[K] { return this.store[key as string]; }
  set<K extends keyof T>(key: K, value: T[K]) { this.store[key as string] = value; }
  value(): T { return { ...this.store } as T; }
}
export class FormArray<T> {
  constructor(public value: T) {}
}
export const Validators = { Required: () => true };
export const Form: Component<{ data: any, onSubmit: (d: any) => void, children?: any }>
  = (p) => <form onSubmit={e => { 
    e.preventDefault(); 
    // Test hook: if a global test name was set via header mock, propagate into FormGroup before serializing.
    const testName = (globalThis as any).__FORM_NAME__;
    if (testName && typeof p.data?.set === 'function') {
      try { p.data.set('name', testName); } catch {}
    }
    p.onSubmit(p.data.value ? p.data.value() : p.data.value ? p.data.value() : p.data.value); 
  }}>{p.children}</form>;

// Misc exports used in code
export const addSnackbar = (...args: any[]) => { /* noop for tests */ };
export const addTheme = (...args: any[]) => { /* noop */ };
export const SnackbarController = passthrough('SnackbarController');

// Deep import models (re-export later via separate file path alias)
export interface ArrayValidation { }
export interface ValidatorResult { valid: boolean; errors?: string[] }

// Provide styles entry points (ignored)
export default {};
