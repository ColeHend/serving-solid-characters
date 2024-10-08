import { indexedDB, IDBKeyRange } from "fake-indexeddb";
import Dexie from "dexie";

const fakeDB = new Dexie("FakeDB", {indexedDB: indexedDB, IDBKeyRange: IDBKeyRange})

export default fakeDB