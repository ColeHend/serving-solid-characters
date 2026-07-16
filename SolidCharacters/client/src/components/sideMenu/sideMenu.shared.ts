import { Groups, WandStars, MenuBook, Shield } from "coles-solid-library/icons";

export type SectionId = "characters" | "homebrew" | "reference" | "dm";

export interface NavLink {
  label: string;
  route: string;
}

export interface NavSection {
  id: SectionId;
  label: string;
  subtitle: string;
  icon: string;
  /** Pathname prefix used to pre-select the section matching the current route. */
  routePrefix: string;
  links: NavLink[];
}

export const SECTIONS: NavSection[] = [
  {
    id: "characters",
    label: "Characters",
    subtitle: "Build and manage your party",
    icon: Groups,
    routePrefix: "/characters",
    links: [
      { label: "My Characters", route: "/characters" },
      { label: "Create Character", route: "/characters/create" },
      { label: "Sheet Mapper", route: "/characters/pdfCreate" },
    ],
  },
  {
    id: "homebrew",
    label: "Homebrew",
    subtitle: "Your custom creations",
    icon: WandStars,
    routePrefix: "/homebrew",
    links: [
      { label: "Classes", route: "/homebrew/create/classes" },
      { label: "Subclasses", route: "/homebrew/create/subclasses" },
      { label: "Backgrounds", route: "/homebrew/create/backgrounds" },
      { label: "Races", route: "/homebrew/create/races" },
      { label: "Subraces", route: "/homebrew/create/subraces" },
      { label: "Spells", route: "/homebrew/create/spells" },
      { label: "Feats", route: "/homebrew/create/feats" },
      { label: "Items", route: "/homebrew/create/items" },
    ],
  },
  {
    id: "reference",
    label: "Reference",
    subtitle: "Official rules and lookups",
    icon: MenuBook,
    routePrefix: "/info",
    links: [
      { label: "Spells", route: "/info/spells" },
      { label: "Feats", route: "/info/feats" },
      { label: "Classes", route: "/info/classes" },
      { label: "Backgrounds", route: "/info/backgrounds" },
      { label: "Items", route: "/info/items" },
      { label: "Races", route: "/info/races" },
    ],
  },
  {
    id: "dm",
    label: "DM",
    subtitle: "Tools for game masters",
    icon: Shield,
    routePrefix: "/dm",
    links: [{ label: "DM Tools", route: "/dm/command" }],
  },
];

export const resolveActiveSection = (pathname: string): SectionId =>
  SECTIONS.find((s) => pathname.startsWith(s.routePrefix))?.id ?? "characters";
