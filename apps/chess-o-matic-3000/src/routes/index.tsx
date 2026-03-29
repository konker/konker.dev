import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';

import { ChessOMatic3000App } from '../features/chess/components/ChessOMatic3000App';

export default function HomePage(): JSX.Element {
  return (
    <>
      <Title>Chess-o-matic 3000</Title>
      <ChessOMatic3000App />
    </>
  );
}
