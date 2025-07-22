# Copilot Instructions for serving-solid-characters

## Project Overview
- **Monorepo** with a .NET backend (C#) and a SolidJS frontend (TypeScript).
- Backend: API controllers in `Controllers/`, data models in `models/`, repositories in `Repositories/`, and data in `data/`.
- Frontend: SolidJS app in `client/`:
  - Components in `src/components/` and `src/shared/components/` (see below for structure)
  - Shared hooks/utilities in `src/shared/customHooks/`
  - Models and enums in `src/shared/models/` and `src/shared/enums/`
  - Styles in `src/assets/`, `src/styles/`, and component-level `.module.scss` files
- Data: Game rules and content in JSON under `data/` (e.g., `subclasses.json`).

## Key Workflows
- **Backend**
  - Build: Use `dotnet build` in the root directory.
  - Run: Use `dotnet run` (ensure SQL Server connection string is set in `appsettings.Development.json`).
  - Migrations: Use `dotnet ef migrations` for database changes.
- **Frontend (SolidJS)**
  - Install dependencies: `pnpm install` (preferred), or `npm install` in `client/`.
  - Dev server: `npm run dev` or `npm start` in `client/` (runs on http://localhost:3000).
  - Build: `npm run build` in `client/` (outputs to `dist/`).
  - Use `pnpm` for dependency management when possible (see `pnpm-lock.yaml`).
  - Main entry: `client/src/index.tsx`
  - TypeScript strict mode is enabled (see `tsconfig.json`).

## Project Conventions
- **Data-driven design:** Game logic, rules, and features are encoded in JSON (see `data/srd/2014/subclasses.json`).
- **Feature metadata:** Features use a `metadata` object with `modifiers` and `conditions` for extensible rules.
- **Separation of concerns:**
  - API logic in `Controllers/`
  - Data access in `Repositories/`
  - Shared models in `models/`
- **Frontend (SolidJS):**
  - Components are organized by feature and type in `src/shared/components/` (e.g., `modals/`, `multiSelect/`, `Table/`, `Tabs/`, etc.).
  
  - Use SolidJS `Component<Props>` and generic props for reusable UI (see `MultiSelect.tsx`, `Table.tsx`).
  - Shared hooks in `src/shared/customHooks/` (e.g., `useDnDClasses`, `useDnDSpells`, `useLogin`).
  - Homebrew and SRD data are accessed via custom hooks (see `customHooks/dndInfo/info/`).
  - Styling uses SCSS modules per component (e.g., `component.module.scss`), with theme variables in `src/styles/_variables.scss` and `src/styles/themes.scss`.
  - Use `Accessor<T>` and `Setter<T>` from SolidJS for state and props.
  - Models and enums are defined in `src/shared/models/` and `src/shared/enums/` for type safety.
  - Utility functions and helpers are in `customHooks/utility/tools/`.
  - Exports are aggregated in `src/shared/index.ts` for shared access.
  - No explicit test runner found; follow SolidJS best practices for new tests.

## Integration Points
- **Backend/Frontend:** Communicate via REST API endpoints defined in `Controllers/`.
- **Frontend Data:**
  - Uses custom hooks to fetch and manage SRD and homebrew data (see `customHooks/dndInfo/info/` and `customHooks/dndInfo/info/homebrew/`).
  - Local IndexedDB storage via Dexie (see `customHooks/utility/localDB/`).
- **Database:** Uses Entity Framework Core; context in `data/SharpAngleContext.cs`.
- **External:** SQL Server required for backend; see `appsettings.Development.json` for config.

## Examples
- To add a new subclass, update the relevant JSON in `data/srd/2014/subclasses.json`.
- To add a new API, create a controller in `Controllers/` and register routes.
- To add a frontend feature:
  - Create a component in `client/src/shared/components/` (e.g., `Tabs/Tab.tsx`, `modals/spellModal/spellModal.component.tsx`).
  - Add styles in a `.module.scss` file next to the component.
  - Use or extend shared hooks from `client/src/shared/customHooks/` for data access.
  - Register new models or enums in `client/src/shared/models/` or `client/src/shared/enums/` as needed.

## References
- Main backend entry: `Program.cs`
- Main frontend entry: `client/src/index.tsx`
- Shared frontend exports: `client/src/shared/index.ts`
- Data schema: `data/` JSON files
- Example SolidJS hooks: `client/src/shared/customHooks/dndInfo/info/all/classes.ts`, `client/src/shared/customHooks/features/useLogin.ts`
- Example component: `client/src/shared/components/Table/table.tsx`

---

**For AI agents:**
- Prefer updating JSON data for rules/logic changes.
- Follow existing patterns for modifiers and conditions in feature metadata.
- Use pnpm for frontend dependency management when possible.
- For new SolidJS components, follow the generic/component patterns in `src/shared/components/` and use SCSS modules for styling.
- Use and extend hooks in `src/shared/customHooks/` for data access and state management.
- Keep backend/DB config in sync with `appsettings.Development.json`.
