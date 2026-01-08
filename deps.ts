export { ensureDir } from "@std/fs";
export { parse as parseJsonC } from "@std/jsonc";
export { dirname, join } from "@std/path";

export { DirectFileManipulator } from "./lib/src/API/DirectFileManipulator.ts";
export type {
	DirectFileManipulatorOptions,
	MetaEntry,
	ReadyEntry,
} from "./lib/src/API/DirectFileManipulatorV2.ts";

export { getDocData } from "./lib/src/common/utils.ts";
export { decodeBinary } from "./lib/src/string_and_binary/convert.ts";

// PouchDB & Plugins
// @ts-types="npm:@types/pouchdb-core"
import HttpPouch from "pouchdb-adapter-http";
import PouchDB from "pouchdb-core";
import Find from "pouchdb-find";
import MapReduce from "pouchdb-mapreduce";
import Replication from "pouchdb-replication";

// Register plugins safely to avoid 'Cannot redefine property' errors
// if the library has already registered them globally.
function safeRegister(plugin: unknown) {
	try {
		// @ts-expect-error: PouchDB plugin types are loosely defined in this context
		PouchDB.plugin(plugin);
	} catch (_e) {
		// Plugin already registered, ignore.
	}
}

safeRegister(HttpPouch);
safeRegister(Find);
safeRegister(MapReduce);
safeRegister(Replication);

export { PouchDB };
