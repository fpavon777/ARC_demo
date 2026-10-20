import { useDialogState, useField } from '@4js-ai/arc-react';
import type { Session, WindowSnapshot } from '@4js-ai/arc-client';
import { ArcDemo } from '../generated/arc_demo';
import { enabled, firstList } from '../lib';

type S = ArcDemo.Session & Session;
type Editor = { value: string | number | null; set: (v: string, o?: { force?: boolean }) => void };

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
      <table className="grid">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.path}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.rows.map((row, r) => {
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
    </>
  );
}
