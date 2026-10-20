/**
 * Regex-based parsing of the .4gl/.per sources and rendering of the TS
 * contract. NOT a general BDL parser: it handles the shapes found in this
 * project (one .4gl driving several forms). Widen the patterns if needed.
 */

// BDL type -> TS field type. Unknown types default to 'string'.
const BDL_TO_TS = {
  CHAR: 'string', VARCHAR: 'string', STRING: 'string',
  INTEGER: 'number', SMALLINT: 'number', DECIMAL: 'number', FLOAT: 'number', SMALLFLOAT: 'number',
  DATE: 'string', DATETIME: 'string',
};
const TYPES = Object.keys(BDL_TO_TS).join('|');

const stripComments = (src) =>
  src
    .split('\n')
    .filter((l) => !/^\s*(#|--)/.test(l))
    .join('\n');

export function parse4gl(src) {
  const text = stripComments(src);
  const actions = [];
  const add = (a) => a && !actions.includes(a) && actions.push(a);
  for (const m of text.matchAll(/\bON\s+ACTION\s+(\w+)/gi)) add(m[1].toLowerCase());
  // MENU COMMAND "Text": the action is named after the text (lower case).
  for (const m of text.matchAll(/\bCOMMAND\s+(?:KEY\s*\([^)]*\)\s*)?"([^"]+)"/gi)) add(m[1].toLowerCase());

  // Every ring menu also exposes the runtime-default `help` action (seen live on the gateway).
  if (/^\s*MENU\b/im.test(text)) add('help');

  // Variable / record member types: `name TYPE(n)` anywhere (DEFINE lines and
  // RECORD members), first definition wins.
  const types = {};
  for (const m of text.matchAll(new RegExp(`^\\s*(?:DEFINE\\s+)?([\\w\\s,]+?)\\s+(${TYPES})\\b`, 'gim'))) {
    for (const name of m[1].split(',').map((n) => n.trim()).filter((n) => /^\w+$/.test(n))) {
      types[name] ??= m[2].toUpperCase();
    }
  }
  return { actions, types };
}

export function parsePer(src) {
  const attrs = src.match(/\bATTRIBUTES\b([\s\S]*?)(?:\n\s*INSTRUCTIONS\b|$)/i)?.[1] ?? '';
  const fields = [];
  for (const stmt of attrs.split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = stmt.match(/FORMONLY\.(\w+)/i);
    if (m && !/^LABEL\b/i.test(stmt)) {
      fields.push({ name: m[1], widget: stmt.match(/^(\w+)/)[1].toUpperCase(), hidden: /\bHIDDEN\b/i.test(stmt) });
    }
  }
  // `a THRU b` ranges are expanded using the form's attribute order.
  const order = fields.map((f) => f.name.toLowerCase());
  const lists = [...src.matchAll(/\bSCREEN\s+RECORD\s+(\w+)\s*\(([^)]*)\)/gi)].map((m) => ({
    name: m[1],
    columns: [...m[2].matchAll(/(?:FORMONLY\.)?(\w+)(?:\s+THRU\s+(?:FORMONLY\.)?(\w+))?/gi)].flatMap((c) => {
      if (!c[2]) return [c[1]];
      const [a, b] = [order.indexOf(c[1].toLowerCase()), order.indexOf(c[2].toLowerCase())];
      return a >= 0 && b >= a ? fields.slice(a, b + 1).map((f) => f.name) : [c[1], c[2]];
    }),
  }));
  return { fields, lists };
}

const tsName = (s) => s.replace(/(^|_)(\w)/g, (_, __, c) => c.toUpperCase());
const tsType = (gfl, name) => BDL_TO_TS[gfl.types[name]] ?? 'string';

export function renderContract({ appId, gflFile, gfl, forms }) {
  const ns = tsName(appId);
  const fieldsOf = (fs, ind) => fs.map((f) => `${ind}${f.name}: ${tsType(gfl, f.name)};`).join('\n');
  const all = new Map();
  for (const f of forms) for (const x of f.fields) all.set(x.name, x);
  const formBlocks = forms
    .map((f) => `    export interface ${tsName(f.name)}Fields {\n${fieldsOf(f.fields, '      ')}\n    }`)
    .join('\n');
  const lists = forms.flatMap((f) => f.lists.map((l) => ({ form: f.name, ...l })));
  const listLines = lists.map((l) => `    ${l.name}: ${JSON.stringify(l.columns)}, // form ${l.form}`).join('\n');
  const actionUnion = gfl.actions.length ? gfl.actions.map((a) => `'${a}'`).join(' | ') : 'never';
  return `/**
 * AUTO-GENERATED Arc contract for \`${appId}\` (program \`${gflFile}\`,
 * forms: ${forms.map((f) => f.name + '.per').join(', ')}).
 *
 * Produced by scripts/generate-contract.mjs - do not edit by hand. \`make\`
 * regenerates it whenever a .4gl or .per file changes.
 */
import type { ReactiveRecord, Session as ArcSession } from '@4js-ai/arc-client';

export namespace ${ns} {
  /** Fields of the form currently open, one interface per form. */
  export namespace Forms {
${formBlocks}
  }

  /** Union of all forms: windows are stacked, a field is a field wherever it sits. */
  export interface Fields {
${fieldsOf([...all.values()], '    ')}
  }

  export type Action = ${actionUnion};

  export interface Session extends Omit<ArcSession, 'fields' | 'actions'> {
    readonly fields: ReactiveRecord<Fields>;
    readonly actions: Record<Action, () => Promise<void>>;
  }
}

/** Screen records (DISPLAY/INPUT ARRAY lists) and their columns. */
export const ${ns}Lists = {
${listLines}
} as const;

export const ${ns} = {
  __app: '${appId}',
} as unknown as { __app: string; __session: ${ns}.Session };
`;
}
