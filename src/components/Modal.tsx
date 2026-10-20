import type { ActionPanel, WindowSnapshot } from '@4js-ai/arc-client';
import { NOISE } from '../lib';

/**
 * Renders a program prompt (`MENU ... STYLE="dialog"` or the runtime's
 * `winmsg` message box) as a modal, one button per action the program
 * currently accepts.
 */
export function Modal({ panel, win, onFire }: { panel: ActionPanel; win: WindowSnapshot; onFire: (name: string) => void }) {
  const names = panel.actions.filter((n) => win.actions[n]?.enabled && !NOISE.has(n));
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>{panel.title ?? 'Confirmar'}</h3>
        {panel.prompt && <p className="prompt">{panel.prompt}</p>}
        <div className="buttons">
          {names.map((n) => (
            <button key={n} onClick={() => onFire(n)}>
              {win.actions[n]?.label ?? n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
