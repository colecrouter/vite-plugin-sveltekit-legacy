import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const output = "test/fixtures/app/.svelte-kit/output/client";
assert.ok(fs.existsSync(path.join(output, "legacy-polyfills.js")));
const entries = fs.readdirSync(path.join(output, "_app/immutable/entry"));
for (const name of ["start", "app"]) {
	const entry = entries.find(
		(file) =>
			file.startsWith(`${name}.`) &&
			file.endsWith(".js") &&
			!file.includes("sveltekit-original"),
	);
	assert.ok(entry, `Missing ${name} entry`);
	assert.match(
		fs.readFileSync(path.join(output, "_app/immutable/entry", entry), "utf8"),
		/import "\.\.\/\.\.\/\.\.\/legacy-polyfills\.js"/,
	);
}
