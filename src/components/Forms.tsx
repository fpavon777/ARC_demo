import { useField } from '@4js-ai/arc-react';
import type { ArcDemo } from '../generated/arc_demo';
import { t } from '../i18n';

type S = ArcDemo.Session;

/** desc.per: one TEXTEDIT bound to `descripcion`. */
export function Descripcion({ session }: { session: S }) {
  const f = useField(session.fields.descripcion);
  return (
    <label className="field stack">
      {t('alta.descripcion')}
      <textarea rows={8} value={f.value ?? ''} onChange={(e) => f.set(e.target.value)} onBlur={() => f.set(f.value, { force: true })} />
    </label>
  );
}

// Items of the `codigop` COMBOBOX (lib_paises.cargar_paises) and the `tipo` RADIOGROUP in
// alta.per. The protocol does not carry item labels: codes are copied here, texts come
// from the .str files.
const PAISES = ['ES', 'FR', 'DE', 'IT', 'PT', 'GB', 'US', 'MX', 'AR', 'BR'];
const TIPOS = [
  { value: 'A', key: 'antiguo' },
  { value: 'N', key: 'nuevo' },
  { value: 'O', key: 'obsoleto' },
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
        {t('alta.cliente')}
        <input
          className="short"
          maxLength={3}
          value={codigo.value ?? ''}
          onChange={(e) => codigo.set(e.target.value.toUpperCase())}
          onBlur={() => codigo.set(codigo.value, { force: true })}
        />
      </label>
      <label className="field stack">
        {t('alta.descripcion')}
        <textarea rows={3} maxLength={100} value={descripcion.value ?? ''} onChange={(e) => descripcion.set(e.target.value)} />
      </label>
      <fieldset className="field">
        <span className="legend">{t('alta.tipo')}</span>
        {TIPOS.map((tp) => (
          <label key={tp.value} className="inline">
            <input type="radio" name="tipo" checked={tipo.value === tp.value} onChange={() => tipo.set(tp.value)} />
            {t(`alta.tipo.${tp.key}`)}
          </label>
        ))}
      </fieldset>
      <label className="field">
        {t('alta.ubicacion')}
        {/* NOT NULL in the form: no empty option; the form's DEFAULT ("ES") is the initial value */}
        <select value={codigop.value ?? 'ES'} onChange={(e) => codigop.set(e.target.value)}>
          {PAISES.map((code) => (
            <option key={code} value={code}>{t(`pais.${code}`)}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
