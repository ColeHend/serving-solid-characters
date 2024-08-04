import { createSignal } from "solid-js";
import { UserSettings } from "../../models/userSettings";
const defaultSettings = createSignal<UserSettings>({
  userId: 0,
  username: "",
  email: "",
  theme: "light"
});
export default function getUserSettings() {
    return defaultSettings;
}