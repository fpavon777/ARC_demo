/**
 * React front end for the demo program (main.4gl) through the Arc gateway.
 *
 * The 4GL is a ring MENU (window w1) that opens one window per option:
 * w2 albaranes (INPUT ARRAY), w3 descripción (INPUT), w4 alta (INPUT).
 * The top window of the stack decides what to render; every button maps to
 * an action the program currently offers (win.actions[name].enabled), so
 * the UI never fires something the 4GL is not listening for.
 */
import { useEffect, useMemo, useState } from 'react';
import { useGeneroSession, useWindowStack } from '@4js-ai/arc-react';
import type { Session, WindowSnapshot } from '@4js-ai/arc-client';
import { ArcDemo } from './generated/arc_demo';
import { Albaranes } from './components/Albaranes';
import { Alta, Descripcion } from './components/Forms';
import { Modal } from './components/Modal';
import { NOISE, WIN, enabled } from './lib';
import { LANGS, t, type Lang } from './i18n';

type S = ArcDemo.Session & Session;

// Window titles of OPEN WINDOW ... text=%"win.*" in app_demo.4gl; the protocol does not carry them.
const TITLES: Record<string, string> = {
  [WIN.menu]: 'app.titulo',
  [WIN.albaranes]: 'win.albaranes',
  [WIN.desc]: 'win.desc',
  [WIN.alta]: 'win.alta',
};

export function App({ lang, onLang }: { lang: Lang; onLang: (lang: Lang) => void }) {
  // one GAS connector per language (<app>_<lang>.xcf): the language is its program argument
  const app = useMemo(() => ({ ...ArcDemo, __app: `${ArcDemo.__app}_${lang}` }), [lang]);
  const session = useGeneroSession(app) as unknown as S;
  const stack = useWindowStack(session);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = t('app.titulo', lang);
    return session.on?.('error', (e) => setError(String((e as { message?: string }).message ?? e)));
  }, [session]);

  if (!session.sessionId) return <p className="muted page">{t('ui.conectando', lang)}</p>;

  const wins = stack.map((e) => e.window);
  const top = wins.at(-1);
  const prompt = [...wins].reverse().find((w) => w.actionPanel?.active && (w.actionPanel.style === 'dialog' || w.actionPanel.style === 'winmsg'));
  const closed = session.state.value.kind === 'closed';
  const fire = (name: string) => void session.actions[name]?.();

  return (
    <main className="page">
      <header>
        <h1>{t((top && TITLES[top.formName]) || 'app.titulo', lang)}</h1>
        {top?.formName === WIN.menu && <span className="muted">{t('portada.fecha', lang, new Date().toLocaleDateString(lang))}</span>}
        <label className="lang">
          {t('ui.idioma', lang)}
          <select value={lang} onChange={(e) => onLang(e.target.value as Lang)}>
            {LANGS.map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
        </label>
      </header>

      {error && <p className="error">{error}</p>}
      {closed && <p className="muted">{t('ui.cerrada', lang)}</p>}
      {top && !closed && <Screen session={session} win={top} onFire={fire} />}

      <Status wins={wins} />
      {prompt?.actionPanel && <Modal panel={prompt.actionPanel} win={prompt} onFire={fire} />}
    </main>
  );
}

function Screen({ session, win, onFire }: { session: S; win: WindowSnapshot; onFire: (name: string) => void }) {
  if (win.formName === WIN.menu) {
    // ring menu: one big button per program action
    const names = win.actionPanel?.actions.filter((n) => !NOISE.has(n)) ?? [];
    return (
      <nav className="menu" aria-label={win.actionPanel?.title ?? 'Programa'}>
        <h2>{win.actionPanel?.title}</h2>
        {names.map((n) => (
          <button key={n} disabled={!enabled(win, n)} onClick={() => onFire(n)}>
            {win.actions[n]?.label ?? n}
          </button>
        ))}
      </nav>
    );
  }
  const body =
    win.formName === WIN.albaranes ? <Albaranes session={session} win={win} /> :
    win.formName === WIN.desc ? <Descripcion session={session} /> :
    win.formName === WIN.alta ? <Alta session={session} /> :
    null;
  return (
    <>
      {body}
      <div className="buttons">
        {(['accept', 'cancel'] as const).map((n) => (
          <button key={n} className={n === 'accept' ? 'primary' : undefined} disabled={!enabled(win, n)} onClick={() => onFire(n)}>
            {win.actions[n]?.label ?? n}
          </button>
        ))}
      </div>
    </>
  );
}

/** MESSAGE / ERROR text of the program, as a status line. */
function Status({ wins }: { wins: WindowSnapshot[] }) {
  const msgs = wins.flatMap((w) => w.messages);
  const last = msgs.at(-1);
  return last ? <p className={`status ${last.severity}`}>{last.text}</p> : null;
}
