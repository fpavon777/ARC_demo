import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArcProvider } from '@4js-ai/arc-react';
import { App } from './App';
import { getLang, setLang, type Lang } from './i18n';
import './app.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

const gateway = import.meta.env['VITE_ARC_GATEWAY'] ?? 'http://127.0.0.1:9000';

function Root() {
  const [lang, setCurrent] = useState<Lang>(getLang);
  // The program chooses its language when it starts: a new language needs a new
  // session, so App is remounted (its old session is closed on unmount).
  const change = (next: Lang) => {
    setLang(next);
    setCurrent(next);
  };
  return (
    <ArcProvider gateway={gateway} token={import.meta.env['VITE_ARC_TOKEN'] ?? 'dev'}>
      <App key={lang} lang={lang} onLang={change} />
    </ArcProvider>
  );
}

// No StrictMode: its double mount would open (and close) a second fglrun session.
createRoot(root).render(<Root />);
