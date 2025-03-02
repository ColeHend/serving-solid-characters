import Dexie from 'dexie';
import { UserSettings } from "../../../../models/userSettings";

class UserSettingDB extends Dexie {
  userSettings!: Dexie.Table<UserSettings, 'userId'>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      userSettings: 'userId'
    })
  }
}
const userSettingDB = new UserSettingDB('userSettings');

export default userSettingDB;