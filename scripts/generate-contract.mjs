#!/usr/bin/env node
/**
 * Regenerates the typed Arc contract (src/generated/<app>.ts) from the
 * program's .4gl/.per sources. Called by `make contract`, which re-runs it
 * whenever any .4gl or .per changes.
 *
 *   node scripts/generate-contract.mjs <app id> <out file> <main.4gl> <form.per>...
 *
 * What is derived mechanically: field names and types (FORMONLY fields of
 * every form + the DEFINE / TYPE RECORD members they bind to), list screen
 * records, and action names (ON ACTION, MENU COMMAND). Labels, layout and
 * rendering stay in the React code. Regex based, scoped to this project's
 * sources: widen scripts/lib/bdl-contract.mjs if a form is misparsed.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { parse4gl, parsePer, renderContract } from './lib/bdl-contract.mjs';

const [appId, outFile, gflFile, ...perFiles] = process.argv.slice(2);
if (!appId || !outFile || !gflFile || perFiles.length === 0) {
  console.error('usage: generate-contract.mjs <app id> <out file> <main.4gl> <form.per>...');
  process.exit(2);
}

// Sources are UTF-8.
const gfl = parse4gl(readFileSync(gflFile, 'utf8'));
const forms = perFiles.map((f) => ({ name: basename(f, '.per'), ...parsePer(readFileSync(f, 'utf8')) }));

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, renderContract({ appId, gflFile: basename(gflFile), gfl, forms }));
const nFields = new Set(forms.flatMap((f) => f.fields.map((x) => x.name))).size;
console.log(`  wrote ${outFile} (${forms.length} form(s), ${nFields} field(s), ${gfl.actions.length} action(s))`);
