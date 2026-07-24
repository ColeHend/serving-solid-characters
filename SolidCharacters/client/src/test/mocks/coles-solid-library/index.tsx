/** @jsxImportSource solid-js */
// Minimal test stub for 'coles-solid-library'
import { JSX, Component, splitProps, For } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';
import { createSignal, untrack } from 'solid-js';

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
// Cell children are row-render functions in the real Table; the mock has no rows to feed them.
export const Cell: Component<AnyProps> = (all: AnyProps) => {
  const [local, rest] = splitProps(all, ['children']);
  return (
    <div data-mock="Cell" {...rest}>
      {typeof local.children === 'function' ? null : local.children}
    </div>
  );
};
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
    >
      {local.children || String(local.value || '')}
      {local.remove && <button data-mock="ChipRemove" aria-label={`remove ${local.value}`} onClick={(e) => { e.stopPropagation(); local.remove(); }}>x</button>}
    </div>
  );
};
export const Chipbar = passthrough('Chipbar');
export const Modal = passthrough('Modal');
// Mirrors the real TabBar's API surface: renders one button per label and
// delivers clicks via onTabChange(label, index).
export const TabBar: Component<AnyProps> = (p) => {
  const [local, rest] = splitProps(p, ['tabs', 'activeTab', 'onTabChange', 'colors', 'size', 'tabPosition', 'indicatorClass', 'noRail', 'animationTiming']);
  return (
    <div data-mock="TabBar" role="tablist" data-active-tab={local.activeTab} {...rest}>
      <For each={(local.tabs ?? []) as string[]}>
        {(label, i) => (
          <button
            data-mock="Tab"
            role="tab"
            aria-selected={local.activeTab === i()}
            onClick={() => local.onTabChange?.(label, i())}
          >{label}</button>
        )}
      </For>
    </div>
  );
};
export const ExpansionPanel = passthrough('ExpansionPanel');
export const FormField = passthrough('FormField');
export const FieldError = passthrough('FieldError');
export const Checkbox: Component<AnyProps> = (p) => <input type="checkbox" data-mock="Checkbox" {...p} />;
export const RadioGroup: Component<AnyProps> = (p) => {
  const [local, rest] = splitProps(p, ['children', 'onChange', 'value', 'label', 'name']);
  return (
    <div data-mock="RadioGroup" role="radiogroup" data-value={local.value} {...rest}>
      {local.label}
      {local.children}
    </div>
  );
};
export const Radio: Component<AnyProps> = (p) => (
  <label data-mock="Radio">
    <input type="radio" value={p.value} disabled={p.disabled} onChange={() => p.onChange?.(p.value)} />
    {p.label}
  </label>
);
export const Select: Component<AnyProps> = (p) => {
  const [local, rest] = splitProps(p, ['children', 'onChange', 'onSelect', 'value']);
  return (
    <select
      data-mock="Select"
      value={local.value as any}
      // Deliver picks via onChange ONLY, like the real Select does for option
      // clicks inside a FormField (its onSelect never fires on that path, so
      // app code must not rely on onSelect). Real onChange additionally echoes
      // from a tracked effect — handlers must be untracked/idempotent.
      // In multiple mode the real Select emits an array; mirror that so
      // multi-select handlers receive string[] (single mode stays a string).
      onChange={(e) => local.onChange && local.onChange(
        p.multiple
          ? Array.from(e.currentTarget.selectedOptions, (o: HTMLOptionElement) => o.value)
          : e.currentTarget.value)}
      {...rest}
    >{local.children}</select>
  );
};
export const Option: Component<AnyProps> = (p) => <option data-mock="Option" value={p.value}>{p.children}</option>;
export const Input: Component<AnyProps> = (p) => <input data-mock="Input" {...p} />;
export const NumberInput: Component<AnyProps> = (p) => {
  const [local, rest] = splitProps(p, ['hideSteppers']);
  void local;
  return <input type="number" data-mock="NumberInput" {...rest} />;
};
export const TextArea: Component<AnyProps> = (p) => {
  const [local, rest] = splitProps(p, ['text','setText','value']);
  const getter = typeof local.text === 'function' ? local.text as () => string : undefined;
  const set = typeof local.setText === 'function' ? local.setText as (v:string)=>void : undefined;
  return <textarea data-mock="TextArea" value={getter ? getter() : (local.value ?? '')} onInput={e => set && set(e.currentTarget.value)} {...rest}/>;
};

// ---------------------------------------------------------------------------
// Forms API — mirrors the real library (v0.5.2) closely enough that code
// written against the real FormGroup/FormArray/Validators behaves the same
// under test: solid-store-backed values (reactive get/getR), signal-backed
// errors, [initial, validators] tuples, FormArray of FormGroups.
// ---------------------------------------------------------------------------

export interface ValidatorResult<T = any> {
  errKey: string;
  revalidate: (val: T) => boolean | Promise<boolean>;
  hide?: (val: T) => boolean;
}
export interface FormError { key: string; hasError: boolean }

const isNullish = (v: unknown): v is null | undefined => v === null || v === undefined;
const cloneVal = <V,>(v: V): V => (v === undefined ? v : structuredClone(unwrap(v as any)) as V);

export class Validators {
  static createValidatorResult<T>(errKey: string, revalidate: (v: T) => boolean | Promise<boolean>, hide?: (v: T) => boolean): ValidatorResult<T> {
    return { errKey, revalidate, hide };
  }
  static get Required(): ValidatorResult {
    return this.createValidatorResult('required', (v: any) =>
      !isNullish(v) && (typeof v === 'string' ? v.trim().length !== 0 : !Array.isArray(v) || v.length !== 0));
  }
  static get Email(): ValidatorResult<string> {
    return this.createValidatorResult('email', (v: any) =>
      !!(isNullish(v) || (typeof v === 'string' && v.trim() === '')) || /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(v));
  }
  static minLength(n: number): ValidatorResult<string | any[]> {
    return this.createValidatorResult('minLength', (v: any) => !isNullish(v) && !(v.length < n));
  }
  static maxLength(n: number): ValidatorResult<string | any[]> {
    return this.createValidatorResult('maxLength', (v: any) => !isNullish(v) && v.length <= n);
  }
  static pattern(errKey: string, re: RegExp): ValidatorResult<string> {
    return this.createValidatorResult(errKey, (v: any) => re.test(v));
  }
  static custom<T>(errKey: string, fn: (v: T) => boolean, hide?: (v: T) => boolean): ValidatorResult<T> {
    return this.createValidatorResult(errKey, fn, hide);
  }
  static asyncCustom<T>(errKey: string, fn: (v: T) => Promise<boolean>, hide?: (v: T) => boolean): ValidatorResult<T> {
    return this.createValidatorResult(errKey, fn, hide);
  }
}

export class FormGroup<T extends Record<string, any>> {
  keys: string[] = [];
  private validators: Record<string, ValidatorResult[]> = {};
  private store: any;
  private setStore: any;
  private errors: () => Record<string, FormError[]>;
  private setErrors: (v: Record<string, FormError[]>) => void;
  private meta: Record<string, { touched: boolean; dirty: boolean; initialValue: any }> = {};

  constructor(public data: { [K in keyof T]: [T[K], ValidatorResult[]] | FormArray<any> }) {
    const init: Record<string, any> = {};
    const errs: Record<string, FormError[]> = {};
    for (const k in data) {
      const def: any = data[k];
      this.keys.push(k);
      if (def instanceof FormArray) {
        init[k] = def;
        this.meta[k] = { touched: false, dirty: false, initialValue: def.get() };
      } else {
        init[k] = cloneVal(def[0]);
        this.validators[k] = def[1] ?? [];
        errs[k] = (def[1] ?? []).map((v: ValidatorResult) => ({ key: v.errKey, hasError: false }));
        this.meta[k] = { touched: false, dirty: false, initialValue: cloneVal(def[0]) };
      }
    }
    const [store, setStore] = createStore(init);
    this.store = store;
    this.setStore = setStore;
    const [errors, setErrors] = createSignal(errs);
    this.errors = errors;
    this.setErrors = setErrors;
  }

  _unsafeRaw() { return this.store; }

  get(): T;
  get<K extends keyof T>(key: K): T[K];
  get(key?: any): any {
    if (key === undefined || key === null) {
      const out: Record<string, any> = {};
      for (const k of this.keys) {
        const v = this.store[k];
        out[k] = v instanceof FormArray ? v.get() : cloneVal(v);
      }
      return out;
    }
    const v = this.store[key];
    return v instanceof FormArray ? v.get() : cloneVal(v);
  }

  getR<K extends keyof T>(key: K): T[K] {
    const v = this.store[key];
    return v instanceof FormArray ? v.get() : v;
  }

  getArrayItem(key: keyof T, index: number) {
    const v = this.store[key];
    return v instanceof FormArray ? v.getAt(index) : undefined;
  }

  set<K extends keyof T>(key: K, value: T[K]) {
    untrack(() => {
      const cur = this.store[key];
      if (cur instanceof FormArray) {
        if (Array.isArray(value)) cur.set(value as any[]);
        return;
      }
      this.setStore((old: any) => ({ ...old, [key]: cloneVal(value) }));
      const m = this.meta[key as string];
      if (m) { m.touched = true; m.dirty = true; }
    });
  }

  // Mirrors the real dist's _deriveLike: build a sibling group from this
  // group's validators (used by FormArray.set to grow the array).
  _deriveLike(value: Partial<T> | undefined): FormGroup<T> | undefined {
    const cfg: any = {};
    for (const k of this.keys) {
      if (this.store[k] instanceof FormArray) return undefined;
      cfg[k] = [(value as any)?.[k], this.validators[k] ?? []];
    }
    return new FormGroup<T>(cfg);
  }

  addToArray(key: keyof T, group: FormGroup<any>) {
    const v = this.store[key];
    if (v instanceof FormArray) v.add(group);
  }
  removeFromArray(key: keyof T, index: number) {
    const v = this.store[key];
    if (v instanceof FormArray) v.remove(index);
  }

  formChangeValue = (): T => this.get();
  fieldChangeValue = <K extends keyof T>(key: K) => () => this.get(key);

  setError(key: keyof T, errKey: string, hasError: boolean) {
    if (this.store[key] instanceof FormArray) return;
    const all = { ...this.errors() };
    const list = [...(all[key as string] ?? [])];
    const idx = list.findIndex(e => e.key === errKey);
    if (idx === -1) list.push({ key: errKey, hasError });
    else list[idx] = { ...list[idx], hasError };
    all[key as string] = list;
    this.setErrors(all);
  }

  getErrors(key: keyof T): FormError[] {
    if (this.store[key] instanceof FormArray) return [];
    return this.errors()[key as string] ?? [];
  }
  hasError(key: keyof T): boolean {
    const v = this.store[key];
    if (v instanceof FormArray) return v.hasError();
    return (this.errors()[key as string] ?? []).some(e => e.hasError);
  }
  hasAnyError(): boolean {
    return this.keys.some(k => this.hasError(k as keyof T));
  }
  getAllErrors(): FormError[] {
    const out: FormError[] = [];
    for (const k of this.keys) out.push(...(this.errors()[k] ?? []));
    return out;
  }
  hasValidator(key: keyof T, errKey: string): boolean {
    const v = this.store[key];
    if (v instanceof FormArray) return v.hasAnyValidator(errKey);
    return (this.validators[key as string] ?? []).some(v2 => v2.errKey === errKey);
  }
  hasAnyValidator(errKey?: string): boolean {
    return this.keys.some(k => {
      const v = this.store[k];
      if (v instanceof FormArray) return v.hasAnyValidator(errKey);
      const list = this.validators[k] ?? [];
      return errKey ? list.some(v2 => v2.errKey === errKey) : list.length > 0;
    });
  }
  addValidator(key: keyof T, validator: ValidatorResult) {
    (this.validators[key as string] ??= []).push(validator);
    this.setError(key, validator.errKey, false);
  }
  removeValidator(key: keyof T, errKey: string) {
    this.validators[key as string] = (this.validators[key as string] ?? []).filter(v => v.errKey !== errKey);
    const all = { ...this.errors() };
    all[key as string] = (all[key as string] ?? []).filter(e => e.key !== errKey);
    this.setErrors(all);
  }

  getMeta(key: keyof T) { return this.meta[key as string]; }
  markTouched(key: keyof T) { const m = this.meta[key as string]; if (m) m.touched = true; }
  markDirty(key: keyof T) { const m = this.meta[key as string]; if (m) m.dirty = true; }

  validate(key?: keyof T): boolean {
    if (key === undefined || key === null) {
      return this.keys.map(k => this.validate(k as keyof T)).every(Boolean);
    }
    const v = this.store[key];
    if (v instanceof FormArray) return v.validateCurrent();
    const list = this.validators[key as string];
    if (!list) return true;
    let ok = true;
    for (const validator of list) {
      try {
        const res = validator.revalidate(v);
        if (typeof (res as any)?.then === 'function') continue; // async treated optimistically
        const hidden = validator.hide?.(v);
        if (hidden) this.setError(key, validator.errKey, false);
        else {
          this.setError(key, validator.errKey, !res);
          if (!res) ok = false;
        }
      } catch {
        this.setError(key, validator.errKey, true);
        ok = false;
      }
    }
    return ok;
  }

  async validateAsync(key?: keyof T): Promise<boolean> {
    if (key === undefined || key === null) {
      const results = await Promise.all(this.keys.map(k => this.validateAsync(k as keyof T)));
      return results.every(Boolean);
    }
    const v = this.store[key];
    if (v instanceof FormArray) return v.validateAsync();
    const list = this.validators[key as string];
    if (!list) return true;
    let ok = true;
    for (const validator of list) {
      try {
        const res = await validator.revalidate(v);
        const hidden = validator.hide?.(v);
        if (hidden) this.setError(key, validator.errKey, false);
        else {
          this.setError(key, validator.errKey, !res);
          if (!res) ok = false;
        }
      } catch {
        this.setError(key, validator.errKey, true);
        ok = false;
      }
    }
    return ok;
  }

  reset() {
    for (const k of this.keys) {
      const v = this.store[k];
      if (v instanceof FormArray) v.reset();
      else this.setStore((old: any) => ({ ...old, [k]: cloneVal(this.meta[k].initialValue) }));
      this.meta[k].touched = false;
      this.meta[k].dirty = false;
    }
    const all = { ...this.errors() };
    for (const k of this.keys) all[k] = (all[k] ?? []).map(e => ({ ...e, hasError: false }));
    this.setErrors(all);
  }
}

export class FormArray<T extends object> {
  private groups: FormGroup<T>[];
  private setGroups: any;
  private initialGroups: FormGroup<T>[];
  private arrayValidators: ValidatorResult<T[]>[];
  private arrayErrors: () => FormError[];
  private setArrayErrors: (v: FormError[]) => void;

  constructor(groups: FormGroup<T>[] = [], arrayValidators: ValidatorResult<T[]>[] = []) {
    const [g, setG] = createStore<FormGroup<T>[]>([...groups]);
    this.groups = g as FormGroup<T>[];
    this.setGroups = setG;
    this.initialGroups = [...groups];
    this.arrayValidators = arrayValidators;
    const [errs, setErrs] = createSignal<FormError[]>([]);
    this.arrayErrors = errs;
    this.setArrayErrors = setErrs;
  }

  get length() { return this.groups.length; }
  get(): T[] { return this.groups.map(g => g.get()); }
  getAt(i: number): T | undefined { return (i < 0 || i >= this.groups.length) ? undefined : this.groups[i].get(); }
  getGroup(i: number): FormGroup<T> | undefined { return (i < 0 || i >= this.groups.length) ? undefined : this.groups[i]; }
  getGroups(): FormGroup<T>[] { return [...this.groups]; }
  getProperty<K extends keyof T>(i: number, key: K): T[K] | undefined { return this.getGroup(i)?.get(key); }

  add(group: FormGroup<T>) { this.setGroups((gs: FormGroup<T>[]) => [...gs, group]); }
  remove(i: number) { this.setGroups((gs: FormGroup<T>[]) => { const next = [...gs]; next.splice(i, 1); return next; }); }
  replace(i: number, group: FormGroup<T>) { this.setGroups((gs: FormGroup<T>[]) => { const next = [...gs]; next[i] = group; return next; }); }

  set(values: T[]) {
    const n = Math.min(values.length, this.groups.length);
    for (let i = 0; i < n; i++) {
      const v: any = values[i];
      for (const k in v) this.groups[i].set(k as keyof T, v[k]);
    }
    if (values.length < this.groups.length) {
      this.setGroups((gs: FormGroup<T>[]) => gs.slice(0, values.length));
    } else if (values.length > this.groups.length) {
      // like the real dist: grow via a template-derived group when possible
      const template = this.groups[this.groups.length - 1] ?? this.initialGroups[this.initialGroups.length - 1];
      const extra: FormGroup<T>[] = [];
      for (const v of values.slice(this.groups.length)) {
        const g = template?._deriveLike(v);
        if (!g) break;
        extra.push(g);
      }
      if (extra.length) this.setGroups((gs: FormGroup<T>[]) => [...gs, ...extra]);
    }
  }
  setAt(i: number, value: T) {
    const g = this.getGroup(i);
    if (!g) return;
    for (const k in value as any) g.set(k as keyof T, (value as any)[k]);
  }
  setProperty<K extends keyof T>(i: number, key: K, value: T[K]) { this.getGroup(i)?.set(key, value); }

  reset() {
    this.initialGroups.forEach(g => g.reset());
    this.setGroups(() => [...this.initialGroups]);
    this.setArrayErrors([]);
  }

  hasError(i?: number): boolean {
    if (i !== undefined && i !== null) return !!this.getGroup(i)?.hasAnyError();
    return this.groups.some(g => g.hasAnyError()) || this.arrayErrors().some(e => e.hasError);
  }
  hasValidator(i: number, errKey: string): boolean { return !!this.getGroup(i)?.hasAnyValidator(errKey); }
  hasAnyValidator(errKey?: string): boolean {
    if (!errKey) return this.arrayValidators.length > 0 || this.groups.some(g => g.hasAnyValidator());
    return this.arrayValidators.some(v => v.errKey === errKey) || this.groups.some(g => g.hasAnyValidator(errKey));
  }
  getErrors(): FormError[][] { return this.groups.map(g => [...g.getAllErrors(), ...this.arrayErrors()]); }
  getErrorsAt(i: number): FormError[] { const g = this.getGroup(i); return g ? [...g.getAllErrors(), ...this.arrayErrors()] : []; }
  getArrayErrors(): FormError[] { return [...this.arrayErrors()]; }

  validate(i?: number): boolean {
    const values = this.get();
    const errs = this.arrayValidators.map(v => ({ key: v.errKey, hasError: !v.revalidate(values) }));
    this.setArrayErrors(errs);
    const arrOk = errs.every(e => !e.hasError);
    if (i !== undefined && i !== null) {
      const g = this.getGroup(i);
      if (!g) return false;
      return g.validate() && arrOk;
    }
    return this.groups.map(g => g.validate()).every(Boolean) && arrOk;
  }
  validateCurrent(i?: number): boolean { return this.validate(i); }
  validateField<K extends keyof T>(i: number, key: K): boolean { return !!this.getGroup(i)?.validate(key); }
  async validateAsync(i?: number): Promise<boolean> { return this.validate(i); }
}

export const Form: Component<{ data: any, onSubmit: (d: any) => void, children?: any }>
  = (p) => <form onSubmit={e => {
    e.preventDefault();
    // Test hook: if a global test name was set via header mock, propagate into FormGroup before serializing.
    const testName = (globalThis as any).__FORM_NAME__;
    if (testName && typeof p.data?.set === 'function') {
      try { p.data.set('name', testName); } catch {}
    }
    p.onSubmit(typeof p.data?.get === 'function' ? p.data.get() : p.data);
  }}>{p.children}</form>;

// Misc exports used in code
export const addSnackbar = (...args: any[]) => { /* noop for tests */ };
export const addTheme = (...args: any[]) => { /* noop */ };
export const SnackbarController = passthrough('SnackbarController');

// Deep import models (re-export later via separate file path alias)
export interface ArrayValidation { }

// Provide styles entry points (ignored)
export default {};
