// Minimal test stub for 'coles-solid-library'
import { JSX, Component, splitProps } from 'solid-js';

type AnyProps = { [k: string]: any } & { children?: any };

function passthrough(tag: string): Component<AnyProps> {
  return (all) => {
    const [local, rest] = splitProps(all, ['children']);
    return (
      <div data-mock={tag} {...rest}>
        {local.children}
      </div>
    );
  };
}

export const Body = passthrough('Body');
export const Button = (props: AnyProps) => <button data-mock="Button" {...props}>{props.children}</button>;
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
export const Chip = passthrough('Chip');
export const Chipbar = passthrough('Chipbar');
export const Modal = passthrough('Modal');
export const TabBar = passthrough('TabBar');
export const ExpansionPanel = passthrough('ExpansionPanel');
export const Checkbox = (p: AnyProps) => <input type="checkbox" data-mock="Checkbox" {...p} />;
export const Select = passthrough('Select');
export const Option = passthrough('Option');
export const Input = (p: AnyProps) => <input data-mock="Input" {...p} />;
export const TextArea = (p: AnyProps) => <textarea data-mock="TextArea" {...p} />;

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
  = (p) => <form onSubmit={e => { e.preventDefault(); p.onSubmit(p.data.value ? p.data.value() : p.data.value ? p.data.value() : p.data.value); }}>{p.children}</form>;

// Misc exports used in code
export const addSnackbar = (...args: any[]) => { /* noop for tests */ };
export const addTheme = (...args: any[]) => { /* noop */ };
export const SnackbarController = passthrough('SnackbarController');

// Deep import models (re-export later via separate file path alias)
export interface ArrayValidation { }
export interface ValidatorResult { valid: boolean; errors?: string[] }

// Provide styles entry points (ignored)
export default {};
