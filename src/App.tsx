/**
 * React front end for the demo program (main.4gl) through the Arc gateway.
 *
 * The 4GL is a ring MENU (window w1) that opens one window per option:
 * w2 albaranes (INPUT ARRAY), w3 descripción (INPUT), w4 alta (INPUT).
 * The top window of the stack decides what to render; every button maps to
 * an action the program currently offers (win.actions[name].enabled), so
 * the UI never fires something the 4GL is not listening for.
 */
import { useEffect, useState } from 'react';
import { useGeneroSession, useWindowStack } from '@4js-ai/arc-react';
import type { Session, WindowSnapshot } from '@4js-ai/arc-client';
import { ArcDemo } from './generated/arc_demo';
import { Albaranes } from './components/Albaranes';
import { Alta, Descripcion } from './components/Forms';
import { Modal } from './components/Modal';
import { NOISE, WIN, enabled } from './lib';

type S = ArcDemo.Session & Session;

const TITLES: Record<string, string> = {
  [WIN.albaranes]: 'Consulta de albaranes',
  [WIN.desc]: 'Texto',
  [WIN.alta]: 'Alta de cliente',
};

export function App() {
  const session = useGeneroSession(ArcDemo) as unknown as S;
  const stack = useWindowStack(session);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Demo';
    return session.on?.('error', (e) => setError(String((e as { message?: string }).message ?? e)));
  }, [session]);

  if (!session.sessionId) return <p className="muted page">Conectando con el programa Genero…</p>;

  const wins = stack.map((e) => e.window);
  const top = wins.at(-1);
  const prompt = [...wins].reverse().find((w) => w.actionPanel?.active && (w.actionPanel.style === 'dialog' || w.actionPanel.style === 'winmsg'));
  const closed = session.state.value.kind === 'closed';
  const fire = (name: string) => void session.actions[name]?.();

  return (
    <main className="page">
      <header>
        <h1>{top ? (TITLES[top.formName] ?? 'Demo') : 'Demo'}</h1>
        {top?.formName === WIN.menu && <span className="muted">Fecha {new Date().toLocaleDateString('es-ES')}</span>}
      </header>

      {error && <p className="error">{error}</p>}
      {closed && <p className="muted">Sesión cerrada.</p>}
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
