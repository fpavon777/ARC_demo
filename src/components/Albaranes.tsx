import { useEffect, useRef } from 'react';
import { useDialogState, useField } from '@4js-ai/arc-react';
import type { Session, WindowSnapshot } from '@4js-ai/arc-client';
import { ArcDemo } from '../generated/arc_demo';
import { enabled, firstList } from '../lib';

type S = ArcDemo.Session & Session;
type Editor = { value: string | number | null; set: (v: string, o?: { force?: boolean }) => void };

// Rows requested from the program at once: the default window is only ~12 rows.
const PAGE_SIZE = 200;

// Items of the `stat_alb` COMBOBOX and the `tiene` CHECKBOX in form_1.per.
const STATUS = [
  { value: 'A', label: 'Alta' },
  { value: 'B', label: 'Bloqueado' },
  { value: 'C', label: 'Cobrado' },
];
const COLUMNS = [
  { path: 'empr_alb', label: 'Empresa' },
  { path: 'nume_alb', label: 'Numero' },
  { path: 'stat_alb', label: 'Stat.' },
  { path: 'clie_alb', label: 'Cliente' },
  { path: 'nomb_cli', label: 'Nombre' },
  { path: 'tiene', label: 'Disp.' },
] as const;

/** form_1.per: INPUT ARRAY over s_consulta. Cells of the current row are editable. */
export function Albaranes({ session, win }: { session: S; win: WindowSnapshot }) {
  const found = firstList(win);
  const state = useDialogState(session);
  const empr = useField(session.fields.empr_alb);
  const nume = useField(session.fields.nume_alb);
  const stat = useField(session.fields.stat_alb);
  const clie = useField(session.fields.clie_alb);
  const nomb = useField(session.fields.nomb_cli);
  const tiene = useField(session.fields.tiene);
  const table = useRef<HTMLDivElement>(null);

  // Ask once for a big window so the whole array is available to scroll through.
  const listPath = found?.path;
  const requested = useRef<string | null>(null);
  useEffect(() => {
    if (!listPath || requested.current === listPath) return;
    requested.current = listPath;
    session.setListCursor(listPath, state.kind === 'inputArray' ? state.rowIndex : 0, { pageSize: PAGE_SIZE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPath, session]);

  // Keep the current row visible while moving through the list.
  const currentRow = state.kind === 'inputArray' ? state.rowIndex : undefined;
  useEffect(() => {
    table.current?.querySelector('tr.current')?.scrollIntoView({ block: 'nearest' });
  }, [currentRow]);

  if (!found || found.list.kind !== 'list') return <p className="muted">Cargando…</p>;
  const { path, list } = found;
  const editors = { empr_alb: empr, nume_alb: nume, stat_alb: stat, clie_alb: clie, nomb_cli: nomb, tiene };
  const idx = (name: string) => list.columns.indexOf(name);
  // After insert/delete the list snapshot reports a null cursor; the dialog state keeps the row.
  const cursor = state.kind === 'inputArray' ? state.rowIndex : list.cursor;

  return (
    <>
      <div className="toolbar">
        {(['append', 'insert', 'delete'] as const).map((a) => (
          <button key={a} disabled={!enabled(win, a)} onClick={() => session.actions[a as never]?.()}>
            {win.actions[a]?.label ?? a}
          </button>
        ))}
      </div>
      <div className="scroll" ref={table}>
      <table className="grid">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.path}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* rows beyond `size` are padding of the requested window */}
          {list.rows.slice(0, Math.max(0, (list.size ?? list.rows.length) - (list.offset ?? 0))).map((row, r) => {
            // `rows` is a window of the array starting at `offset`; `cursor` is absolute
            const abs = (list.offset ?? 0) + r;
            const current = abs === cursor;
            return (
              <tr key={r} className={current ? 'current' : undefined} onClick={() => !current && session.setListCursor(path, abs)}>
                {COLUMNS.map((c) => {
                  const cell = String(row[idx(c.path)] ?? '');
                  if (!current) {
                    return (
                      <td key={c.path}>
                        {c.path === 'stat_alb' ? (STATUS.find((s) => s.value === cell)?.label ?? cell) : c.path === 'tiene' ? (cell === 'S' ? '✓' : '') : cell}
                      </td>
                    );
                  }
                  const ed = editors[c.path] as unknown as Editor;
                  return (
                    <td key={c.path}>
                      {c.path === 'stat_alb' ? (
                        <select value={ed.value ?? cell} onChange={(e) => ed.set(e.target.value)}>
                          {STATUS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      ) : c.path === 'tiene' ? (
                        <input type="checkbox" checked={(ed.value ?? cell) === 'S'} onChange={(e) => ed.set(e.target.checked ? 'S' : 'N')} />
                      ) : (
                        <input
                          value={String(ed.value ?? cell)}
                          onChange={(e) => ed.set(e.target.value)}
                          onBlur={() => ed.set(String(ed.value ?? ''), { force: true })}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </>
  );
}
