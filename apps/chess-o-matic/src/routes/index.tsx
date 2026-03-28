import { Title } from '@solidjs/meta';

import { ChessOMaticApp } from '../features/chess/components/ChessOMaticApp';

export default function HomePage() {
  return (
    <>
      <Title>Chess-o-Matic</Title>
      <ChessOMaticApp />
    </>
  );
}
