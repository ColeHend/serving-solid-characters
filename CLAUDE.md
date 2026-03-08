# Solid Characters

A SolidJS + .NET character management app. The frontend lives in `SolidCharacters/client/`.

## Key Guidance

### Use `coles-solid-library`

This project depends on the `coles-solid-library` npm package. **Always prefer its components and utilities over building custom equivalents.** Before creating any new UI component, check if `coles-solid-library` already provides it.

All imports come from `'coles-solid-library'`. Full documentation is available at `node_modules/coles-solid-library/USAGE.html`.

### Available Components

| Component | Use for |
|---|---|
| `Button` | All buttons — supports `theme`, `borderTheme`, `transparent`, `disabled` |
| `Input` | Text inputs — controlled via `value`/`onChange` |
| `TextArea` | Multi-line text — uses signal pair `text`/`setText`, auto-grows |
| `Select` + `Option` | Dropdowns — single or `multiple`, keyboard navigable |
| `Checkbox` | Checkboxes — `checked`/`onChange` |
| `RadioGroup` + `Radio` | Radio selections — `value`/`onChange` |
| `Modal` | Dialogs — controlled via `show={[getter, setter]}` signal pair |
| `TabBar` | Tab navigation — `tabs` array, `onTabChange` callback |
| `Carousel` | Slide containers — `elements` array or children |
| `Container` | Themed surface wrapper — `theme` prop for color scheme |
| `Body` | Content wrapper with spacing/typography |
| `Chip` / `Chipbar` | Tag-like display elements |
| `ExpansionPanel` | Accordion collapsible — `children={[header, body]}` tuple |
| `Menu` / `MenuItem` / `MenuDropdown` | Popup menus anchored to elements |
| `Icon` | Material Symbols SVGs — `name`, `size`, `variant`, `color` |
| `Table` / `Column` / `Header` / `Cell` / `Row` | Advanced data table with contextual self-registration |

### Forms API

Use `FormGroup` for form state and validation instead of manual signal wiring:

```tsx
import { FormGroup, Form, FormField, Input, ColeError, Validators } from 'coles-solid-library';

const form = new FormGroup({
  name: ['', [Validators.Required]],
  email: ['', [Validators.Required, Validators.Email]],
});

<Form data={form} onSubmit={(values) => handleSubmit(values)}>
  <FormField name="Name" formName="name" required>
    <Input />
    <ColeError errorName="required">Name is required</ColeError>
  </FormField>
</Form>
```

Key classes: `FormGroup`, `FormArray`, `Validators` (Required, Email, minLength, maxLength, pattern, custom, asyncCustom).

### Snackbar Notifications

Use `addSnackbar()` for toast notifications. `<SnackbarController />` should be rendered once at app root.

```ts
import { addSnackbar } from 'coles-solid-library';
addSnackbar({ message: 'Saved!', severity: 'success' });
```

### Utilities

| Function | Purpose |
|---|---|
| `Clone(obj)` | Deep clone with cycle/Date/RegExp support |
| `CloneStore(val)` | Structured clone of unwrapped Solid store |
| `isNullish(v)` | Null/undefined type guard |
| `isMobile()` | User-agent mobile check |
| `useClickOutside(refs, cb)` | Click-outside detection |
| `getMouse()` | Mouse position accessor |
| `addTheme('dark' \| 'light')` | Set theme on body |

### Theming

Theme is initialized with `addTheme('dark')` and styles are imported via:
```scss
@use 'coles-solid-library/themes/themes.scss';
```

Use the `theme` prop on `Container` and `Button` rather than manual hex colors. Available themes: `primary`, `primaryVariant`, `secondary`, `secondaryVariant`, `background`, `surface`, `surfaceVariant`, `container`, `error`.

CSS variables available: `--primary-color`, `--secondary-color`, `--surface-color`, `--container-color`, `--on-primary-color`, `--on-surface-color`, `--font-size-h1` through `--font-size-small`, `--spacing-1` through `--spacing-4`, `--shadow-elevation-1` through `--shadow-elevation-3`.

## Project Structure

- `SolidCharacters/client/` — SolidJS frontend
- `SolidCharacters/` — .NET backend
- `SolidCharacters.Domain/` — Domain models
- `SolidCharacters.Repository/` — Data access
- `SolidCharacters.Tests/` — .NET tests
