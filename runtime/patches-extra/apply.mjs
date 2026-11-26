#!/usr/bin/env node
// Edits carried by the shipped minified client bundles. The v1.3.0 patch set
// targets rc.1's readable sources; rc.5 ships single-line bundles, so these
// features are applied as exact substring edits and verified by assertion.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2];
if (root === undefined) {
	console.error("usage: apply.mjs <dsh-prefix>");
	process.exit(2);
}

const edits = [
	{
		name: "web-composer-mobile-newline",
		file: "node_modules/@deepseek-ai/dsh-client-ui-conversation/lib/client.js",
		from: "event?.preventDefault();if(event?.repeat===true)return true;",
		to: "if(!event?.ctrlKey&&!event?.metaKey&&(0,_deepseek_ai_dsh_client_ui_primitives.isMobileDevice)())return false;event?.preventDefault();if(event?.repeat===true)return true;"
	},
	{
		name: "input-trigger-source-recovery",
		file: "node_modules/@deepseek-ai/dsh-client-ui-input-trigger/lib/client.js",
		from: "if(launched||!prev.open||prev.hit===null||prev.hit.trigger!==hit.trigger)this.menu.set(seedGroups(this.menu.getSnapshot(),roster));",
		to: "if(launched||!prev.open||prev.hit===null||prev.hit.trigger!==hit.trigger||roster.some(source=>!prev.groups.some(group=>group.source===source.name)))this.menu.set(seedGroups(this.menu.getSnapshot(),roster));"
	},
	{
		name: "web-search-key-write-result",
		file: "node_modules/@deepseek-ai/dsh-client-ui-settings-web-search/lib/client.js",
		from: "async writeKey(value){const ref=this.savingRef;await this.ctx.remote.credentials.set(ref,value);return(await this.readCredential(ref))?.[ref]?.configured??false}",
		to: "async writeKey(value){const ref=this.savingRef;const result=await this.ctx.remote.credentials.set(ref,value);if(!result.ok)return false;return(await this.readCredential(ref))?.[ref]?.configured??false}"
	}
];

let applied = 0;
for (const edit of edits) {
	const path = join(root, edit.file);
	const text = readFileSync(path, "utf8");
	const hits = text.split(edit.from).length - 1;
	if (hits !== 1) {
		console.error(`extra edit ${edit.name}: anchor occurs ${hits} times in ${edit.file}`);
		process.exit(1);
	}
	writeFileSync(path, text.replace(edit.from, edit.to));
	applied += 1;
	console.log(`extra edit ${edit.name}: applied`);
}
console.log(`extra edits applied: ${applied}`);
