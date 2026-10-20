#!/usr/bin/env node
/**
 * Generates the dictionary of the React UI from the .str files the 4GL uses,
 * so both front ends share keys and translations.
 *
 *   node scripts/generate-i18n.mjs <out file> <lang>...
 *
 * Reads strings/<lang>/arc_demo.str (key = "value" lines, as fglmkstr) and
 * writes src/generated/i18n.ts. The first language is the default.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const [outFile, ...langs] = process.argv.slice(2);
if (!outFile || langs.length === 0) {
  console.error('usage: generate-i18n.mjs <out file> <lang>...');
  process.exit(2);
}

const unescape = (v) => v.replace(/\\(.)/g, (_, c) => ({ n: '\n', t: '\t', r: '\r', l: '\n' })[c] ?? c);

function parseStr(text, file) {
  const out = {};
  for (const [i, line] of text.split('\n').entries()) {
    if (!line.trim() || /^\s*(#|--)/.test(line)) continue;
    const m = line.match(/^\s*(?:"((?:[^"\\]|\\.)*)"|(\S+))\s*=\s*"((?:[^"\\]|\\.)*)"\s*$/);
    if (!m) throw new Error(`${file}:${i + 1}: cannot parse "${line}"`);
    out[unescape(m[1] ?? m[2])] = unescape(m[3]);
  }
  return out;
}

const messages = Object.fromEntries(langs.map((l) => [l, parseStr(readFileSync(`strings/${l}/arc_demo.str`, 'utf8'), `strings/${l}/arc_demo.str`)]));
const keys = new Set(langs.flatMap((l) => Object.keys(messages[l])));
for (const l of langs) {
  const missing = [...keys].filter((k) => !(k in messages[l]));
  if (missing.length) console.warn(`  warning: strings/${l}/arc_demo.str lacks ${missing.length} key(s): ${missing.slice(0, 5).join(', ')}`);
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  `/**
 * AUTO-GENERATED from strings/<lang>/arc_demo.str by scripts/generate-i18n.mjs -
 * do not edit by hand. \`make\` regenerates it when a .str file changes.
 */
export const LANGS = ${JSON.stringify(langs)} as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = ${JSON.stringify(langs[0])};

export const messages: Record<Lang, Record<string, string>> = ${JSON.stringify(messages, null, 2)};
`,
);
console.log(`  wrote ${outFile} (${langs.length} language(s), ${keys.size} key(s))`);
