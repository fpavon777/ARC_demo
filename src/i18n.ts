/**
 * Language of the React UI and of the Genero program.
 *
 * The program picks its language once, when the session starts (lib_idioma.4gl),
 * from the argument of the GAS connector it was opened through: the UI opens
 * `<app>_<lang>` (see App.tsx). The labels the program sends (menus, messages,
 * prompts, action texts) and the ones this UI draws (taken from the same .str
 * files) are then in the same language. Changing the language therefore means
 * opening a new session (see main.tsx).
 */
import { DEFAULT_LANG, LANGS, messages, type Lang } from './generated/i18n';

const STORAGE_KEY = 'arc_demo.lang';

/** "es-ES", "es_ES" or "es" -> "es" when supported. */
export function normalise(value: string | null | undefined): Lang | null {
  const code = value?.slice(0, 2).toLowerCase();
  return (LANGS as readonly string[]).includes(code ?? '') ? (code as Lang) : null;
}

/** Saved choice, else the browser language, else the default one. */
export function getLang(): Lang {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* storage can be blocked: the choice then lasts until reload */
  }
  return normalise(saved) ?? normalise(navigator.language) ?? DEFAULT_LANG;
}

export function setLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* see getLang */
  }
}

/** Text of a key in a language; the key itself when it is missing. */
export function t(key: string, lang: Lang = getLang(), ...args: unknown[]): string {
  const text = messages[lang][key] ?? messages[DEFAULT_LANG][key] ?? key;
  return args.reduce<string>((acc, a, i) => acc.replace(`%${i + 1}`, String(a)), text);
}

export { LANGS };
export type { Lang };
