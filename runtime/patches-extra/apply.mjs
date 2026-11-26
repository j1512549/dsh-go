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
		name: "web-preset-save-freshness",
		file: "node_modules/@deepseek-ai/dsh-client-ui-agent-preset/lib/client.js",
		from: "const error=await write();await this.load();if(error!==void 0)throw new Error(error);const selected=this.store.getSnapshot().rows.find(row=>row.isDefault);",
		to: "const error=await write();await this.loading;await this.load();if(error!==void 0)throw new Error(error);if(this.store.getSnapshot().status!==`ready`)return;const selected=this.store.getSnapshot().rows.find(row=>row.isDefault);"
	},
	{
		name: "web-empty-reply-notice-zh",
		file: "node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js",
		from: "\"message.turnProcess.took\":`已完成，用时 `,",
		to: "\"message.turnProcess.took\":`已完成，用时 `,\"message.turnProcess.noReply\":`未收到答复`,\"message.turnNoReply\":`本轮已结束，但没有可显示的答复。请先查看过程或工具结果，再决定是否发消息继续。`,"
	},
	{
		name: "web-empty-reply-notice-en",
		file: "node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js",
		from: "\"message.turnProcess.took\":`Completed in `,",
		to: "\"message.turnProcess.took\":`Completed in `,\"message.turnProcess.noReply\":`No reply received`,\"message.turnNoReply\":`This turn ended without a visible reply. Check the process or tool results before sending a follow-up.`,"
	},
	{
		name: "web-empty-reply-label",
		file: "node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js",
		from: "const stopped=reason===`aborted`||reason===`interrupted`;const elapsedMs=turn.start===void 0||turn.end===void 0?void 0:Math.max(1e3,turn.end.time-turn.start.time);const duration=elapsedMs===void 0||stopped||reason===`error`?void 0:formatRunDuration(elapsedMs,t);const label=stopped?t(`message.stopped`):reason===`error`?t(`message.turnProcess.failed`):duration===void 0?t(`message.turnProcess.worked`):t(`message.turnProcess.took`);const announcement=stopped?t(`message.stopped`):reason===`error`?t(`message.turnProcess.failed`):t(`message.turnProcess.worked`);",
		to: "const noReply=reason===`completed`&&node.data.answerAnchorSeq===null&&node.data.messageCount===0;const stopped=reason===`aborted`||reason===`interrupted`;const elapsedMs=turn.start===void 0||turn.end===void 0?void 0:Math.max(1e3,turn.end.time-turn.start.time);const duration=elapsedMs===void 0||stopped||reason===`error`||noReply?void 0:formatRunDuration(elapsedMs,t);const label=noReply?t(`message.turnProcess.noReply`):stopped?t(`message.stopped`):reason===`error`?t(`message.turnProcess.failed`):duration===void 0?t(`message.turnProcess.worked`):t(`message.turnProcess.took`);const announcement=noReply?t(`message.turnProcess.noReply`):stopped?t(`message.stopped`):reason===`error`?t(`message.turnProcess.failed`):t(`message.turnProcess.worked`);"
	},
	{
		name: "web-empty-reply-tail",
		file: "node_modules/@deepseek-ai/dsh-client-ui-chat/lib/client.js",
		from: "if(closing===null)return tail===null?null:(0,react_jsx_runtime.jsx)(`div`,{className:TurnTailNodeView_module_css_default.root,\"data-turn-tail\":data.turn,children:tail});",
		to: "const noReplied=useChat(snapshot=>{const turnRef=node.location.kind===`turn`||node.location.kind===`step`?node.location.turn:void 0;if(turnRef===void 0||turnRef.status!==`closed`||turnRef.end?.data.reason.kind!==`completed`)return false;const keys=snapshot.locations.getTurn(turnRef);for(const key of keys){const candidate=snapshot.nodes.get(key);if(candidate?.kind===`assistant-step`&&hasAssistantReplyContent(candidate.data.blocks))return false}return true});const notice=noReplied?(0,react_jsx_runtime.jsx)(`div`,{role:`status`,\"data-turn-no-reply\":true,children:t(`message.turnNoReply`)}):null;if(closing===null)return tail===null&&notice===null?null:(0,react_jsx_runtime.jsxs)(`div`,{className:TurnTailNodeView_module_css_default.root,\"data-turn-tail\":data.turn,children:[notice,tail]});"
	},
	{
		name: "provider-discovery-headers",
		file: "node_modules/@deepseek-ai/dsh-api-remotes/lib/client.js",
		count: 2,
		from: "describe(`Credential for this interrogation alone; the harness never stores it.`)});",
		to: "describe(`Credential for this interrogation alone; the harness never stores it.`),\"headers\":zod.z.array(zod.z.object({\"name\":zod.z.string(),\"value\":zod.z.string()})).optional().describe(`Request headers for this interrogation only; omission uses the stored profile, and an empty list clears it.`)});"
	},
	{
		name: "web-search-key-write-result",
		file: "node_modules/@deepseek-ai/dsh-client-ui-settings-web-search/lib/client.js",
		from: "async writeKey(value){const ref=this.savingRef;await this.ctx.remote.credentials.set(ref,value);return(await this.readCredential(ref))?.[ref]?.configured??false}",
		to: "async writeKey(value){const ref=this.savingRef;const result=await this.ctx.remote.credentials.set(ref,value);if(!result.ok)return false;return(await this.readCredential(ref))?.[ref]?.configured??false}"
	},
	{"name": "provider-headers-zod:typert.host.js", "file": "node_modules/@deepseek-ai/dsh-llm/lib/typert.host.js", "count": 2, "from": "'apiKey': z.string().optional().describe('Credential for this interrogation alone; the harness never stores it.'),\n}))", "to": "'apiKey': z.string().optional().describe('Credential for this interrogation alone; the harness never stores it.'),\n  'headers': z.array(z.object({\n  'name': z.string(),\n  'value': z.string(),\n})).optional().describe('Request headers for this interrogation only; omission uses the stored profile, and an empty list clears it.'),\n}))"},
	{"name": "provider-headers-jsonschema:typert.host.js:true", "file": "node_modules/@deepseek-ai/dsh-llm/lib/typert.host.js", "from": "\"apiKey\":{\"type\":\"string\",\"description\":\"Credential for this interrogation alone; the harness never stores it.\"}},\"required\":[],\"additionalProperties\":true},", "to": "\"apiKey\":{\"type\":\"string\",\"description\":\"Credential for this interrogation alone; the harness never stores it.\"},\"headers\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"value\":{\"type\":\"string\"}},\"required\":[\"name\",\"value\"],\"additionalProperties\":true},\"description\":\"Request headers for this interrogation only; omission uses the stored profile, and an empty list clears it.\"}},\"required\":[],\"additionalProperties\":true},"},
	{"name": "provider-headers-jsonschema:typert.host.js:false", "file": "node_modules/@deepseek-ai/dsh-llm/lib/typert.host.js", "from": "\"apiKey\":{\"type\":\"string\",\"description\":\"Credential for this interrogation alone; the harness never stores it.\"}},\"required\":[],\"additionalProperties\":false},", "to": "\"apiKey\":{\"type\":\"string\",\"description\":\"Credential for this interrogation alone; the harness never stores it.\"},\"headers\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"value\":{\"type\":\"string\"}},\"required\":[\"name\",\"value\"],\"additionalProperties\":false},\"description\":\"Request headers for this interrogation only; omission uses the stored profile, and an empty list clears it.\"}},\"required\":[],\"additionalProperties\":false},"},
	{"name": "provider-headers-zod:typert.remote-client.js", "file": "node_modules/@deepseek-ai/dsh-llm/lib/typert.remote-client.js", "count": 2, "from": "'apiKey': z.string().optional().describe('Credential for this interrogation alone; the harness never stores it.'),\n}))", "to": "'apiKey': z.string().optional().describe('Credential for this interrogation alone; the harness never stores it.'),\n  'headers': z.array(z.object({\n  'name': z.string(),\n  'value': z.string(),\n})).optional().describe('Request headers for this interrogation only; omission uses the stored profile, and an empty list clears it.'),\n}))"},
	{"name": "provider-headers-jsonschema:typert.remote-client.js:true", "file": "node_modules/@deepseek-ai/dsh-llm/lib/typert.remote-client.js", "from": "\"apiKey\":{\"type\":\"string\",\"description\":\"Credential for this interrogation alone; the harness never stores it.\"}},\"required\":[],\"additionalProperties\":true},", "to": "\"apiKey\":{\"type\":\"string\",\"description\":\"Credential for this interrogation alone; the harness never stores it.\"},\"headers\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"value\":{\"type\":\"string\"}},\"required\":[\"name\",\"value\"],\"additionalProperties\":true},\"description\":\"Request headers for this interrogation only; omission uses the stored profile, and an empty list clears it.\"}},\"required\":[],\"additionalProperties\":true},"},
	{"name": "provider-headers-jsonschema:typert.remote-client.js:false", "file": "node_modules/@deepseek-ai/dsh-llm/lib/typert.remote-client.js", "from": "\"apiKey\":{\"type\":\"string\",\"description\":\"Credential for this interrogation alone; the harness never stores it.\"}},\"required\":[],\"additionalProperties\":false},", "to": "\"apiKey\":{\"type\":\"string\",\"description\":\"Credential for this interrogation alone; the harness never stores it.\"},\"headers\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"},\"value\":{\"type\":\"string\"}},\"required\":[\"name\",\"value\"],\"additionalProperties\":false},\"description\":\"Request headers for this interrogation only; omission uses the stored profile, and an empty list clears it.\"}},\"required\":[],\"additionalProperties\":false},"},
	{"name": "provider-headers-pi-ai", "file": "node_modules/@deepseek-ai/dsh-llm-pi-ai/lib/index.js", "from": "\t\tconst headers = new Headers(stored?.headers === void 0 ? void 0 : Object.entries(stored.headers));", "to": "\t\tconst configuredHeaders = request.headers?.map(({ name, value }) => [name, value]) ?? (stored?.headers === void 0 ? void 0 : Object.entries(stored.headers));\n\t\tconst headers = new Headers(configuredHeaders);"},
];

let applied = 0;
for (const edit of edits) {
	const path = join(root, edit.file);
	const text = readFileSync(path, "utf8");
	const hits = text.split(edit.from).length - 1;
	const expected = edit.count ?? 1;
	if (hits !== expected) {
		console.error(`extra edit ${edit.name}: anchor occurs ${hits} times in ${edit.file}, expected ${expected}`);
		process.exit(1);
	}
	writeFileSync(path, edit.count === undefined ? text.replace(edit.from, edit.to) : text.split(edit.from).join(edit.to));
	applied += 1;
	console.log(`extra edit ${edit.name}: applied`);
}
console.log(`extra edits applied: ${applied}`);
