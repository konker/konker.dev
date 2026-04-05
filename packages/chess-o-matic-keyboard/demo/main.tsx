import { render } from 'solid-js/web';

import '@konker.dev/chess-o-matic-keyboard/solid/chess-keyboard.css';

import { DemoPage } from './DemoPage';
import './demo.css';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('Missing demo root element');
}

render(() => <DemoPage />, root);
