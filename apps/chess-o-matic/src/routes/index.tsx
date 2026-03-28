import { Title } from '@solidjs/meta';
import type { JSX } from 'solid-js';

import { ChessOMaticApp } from '../features/chess/components/ChessOMaticApp';

export default function HomePage(): JSX.Element {
  return (
    <>
      <Title>Chess-o-Matic</Title>
      <ChessOMaticApp />
    </>
  );
}
