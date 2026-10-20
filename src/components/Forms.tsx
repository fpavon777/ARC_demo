import { useField } from '@4js-ai/arc-react';
import type { ArcDemo } from '../generated/arc_demo';

type S = ArcDemo.Session;

/** desc.per: one TEXTEDIT bound to `descripcion`. */
export function Descripcion({ session }: { session: S }) {
  const f = useField(session.fields.descripcion);
  return (
    <label className="field stack">
      Descripción
      <textarea rows={8} value={f.value ?? ''} onChange={(e) => f.set(e.target.value)} onBlur={() => f.set(f.value, { force: true })} />
    </label>
  );
}

// Items of the `codigop` COMBOBOX and the `tipo` RADIOGROUP in alta.per.
const PROVINCIAS = [
  { value: '41', label: 'Sevilla' },
  { value: '28', label: 'Madrid' },
];
const TIPOS = [
  { value: 'A', label: 'Antiguo' },
  { value: 'N', label: 'Nuevo' },
  { value: 'O', label: 'Obsoleto' },
];

/** alta.per: customer registration form. */
export function Alta({ session }: { session: S }) {
  const codigo = useField(session.fields.codigo);
  const descripcion = useField(session.fields.descripcion);
  const tipo = useField(session.fields.tipo);
  const codigop = useField(session.fields.codigop);
  return (
    <div className="form">
      <label className="field">
        Cliente
        <input
          className="short"
          maxLength={3}
          value={codigo.value ?? ''}
          onChange={(e) => codigo.set(e.target.value.toUpperCase())}
          onBlur={() => codigo.set(codigo.value, { force: true })}
        />
      </label>
      <label className="field stack">
        Descripción
        <textarea rows={3} maxLength={100} value={descripcion.value ?? ''} onChange={(e) => descripcion.set(e.target.value)} />
      </label>
      <fieldset className="field">
        <span className="legend">Tipo</span>
        {TIPOS.map((t) => (
          <label key={t.value} className="inline">
            <input type="radio" name="tipo" checked={tipo.value === t.value} onChange={() => tipo.set(t.value)} />
            {t.label}
          </label>
        ))}
      </fieldset>
      <label className="field">
        Ubicación
        <select value={codigop.value ?? ''} onChange={(e) => codigop.set(e.target.value)}>
          <option value="" />
          {PROVINCIAS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
