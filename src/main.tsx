import { createRoot } from 'react-dom/client';
import { ArcProvider } from '@4js-ai/arc-react';
import { App } from './App';
import './app.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

const gateway = import.meta.env['VITE_ARC_GATEWAY'] ?? 'http://127.0.0.1:9000';

// No StrictMode: its double mount would open (and close) a second fglrun session.
createRoot(root).render(
  <ArcProvider gateway={gateway} token={import.meta.env['VITE_ARC_TOKEN'] ?? 'dev'}>
    <App />
  </ArcProvider>,
);
