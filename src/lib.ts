import type { WindowSnapshot } from '@4js-ai/arc-client';

/** The runtime-default actions that no screen renders as a button of its own. */
export const NOISE = new Set(['help', 'close']);

/** Window names given by `OPEN WINDOW wN` in main.4gl. */
export const WIN = { menu: 'w1', albaranes: 'w2', desc: 'w3', alta: 'w4' } as const;

/** The first (and here only) list of a window; its AUI name (`list_NN`) is not stable. */
export function firstList(w: WindowSnapshot) {
  const entry = Object.entries(w.lists)[0];
  return entry ? { path: entry[0], list: entry[1] } : null;
}

/** Window action offered right now by the program. */
export const enabled = (w: WindowSnapshot, name: string): boolean => w.actions[name]?.enabled === true;
