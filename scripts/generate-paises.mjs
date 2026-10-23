#!/usr/bin/env node
/**
 * Generates src/generated/paises.ts from the table `paises` of the PostgreSQL database, so the
 * React combobox lists exactly what the 4GL cursor (lib_paises.4gl) loads. The Arc protocol does
 * not carry combobox items, so the UI needs its own copy.
 *
 *   node scripts/generate-paises.mjs <database> <out file>
 *
 * Needs psql and the database (make db). Rows are ordered by name in the database collation,
 * as the cursor does.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const [db, outFile] = process.argv.slice(2);
if (!db || !outFile) {
  console.error('usage: generate-paises.mjs <database> <out file>');
  process.exit(2);
}

const rows = execFileSync(
  'psql',
  ['-d', db, '-At', '-F', '|', '-c', 'SELECT idioma, codigo, nombre FROM paises ORDER BY idioma, nombre'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
)
  .split('\n')
  .filter(Boolean)
  .map((l) => l.split('|'));

const byLang = {};
for (const [lang, code, name] of rows) (byLang[lang.trim()] ??= []).push({ code: code.trim(), name });

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  `/**
 * AUTO-GENERATED from the table \`paises\` of the database "${db}" by scripts/generate-paises.mjs -
 * do not edit by hand. \`make\` regenerates it when db/schema.sql or db/seed.sql change.
 */
export const PAISES: Record<string, ReadonlyArray<{ code: string; name: string }>> = ${JSON.stringify(byLang, null, 2)};
`,
);
console.log(`  wrote ${outFile} (${Object.keys(byLang).length} language(s), ${rows.length} row(s))`);
