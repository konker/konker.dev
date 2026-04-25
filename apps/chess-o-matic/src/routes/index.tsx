import { Title } from '@solidjs/meta';
import { useNavigate, useSearchParams } from '@solidjs/router';
import type { JSX } from 'solid-js';

import { ChessOMatic3000App } from '../features/chess/components/ChessOMatic3000App';

export default function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedGameId = Array.isArray(searchParams.gameId) ? searchParams.gameId[0] : searchParams.gameId;
  const requestNewGame = Array.isArray(searchParams.newGame)
    ? searchParams.newGame[0] === '1'
    : searchParams.newGame === '1';

  return (
    <>
      <Title>Chess-o-matic</Title>
      <ChessOMatic3000App
        onConsumeRouteAction={() => void navigate('/', { replace: true })}
        onGoToHistory={() => void navigate('/games')}
        requestedGameId={requestedGameId}
        requestNewGame={requestNewGame}
      />
    </>
  );
}
