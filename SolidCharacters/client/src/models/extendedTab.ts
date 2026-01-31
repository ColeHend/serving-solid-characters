import { Tab } from "../components/navbar/navbar";

export interface ExtendedTab extends Tab {
    isOpen: boolean;
    children?: ExtendedTab[];
  }