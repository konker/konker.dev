import * as P from '@konker.dev/effect-ts-prelude';

import type { MomentoClientConfigProps } from '@konker.dev/momento-cache-client-effect';
import { MomentoClientDeps, MomentoClientFactoryDeps } from '@konker.dev/momento-cache-client-effect';

import type { Handler } from '../index';

const TAG = 'momentoClientInit';

export type Adapted<WR> = Exclude<WR, MomentoClientDeps> | MomentoClientFactoryDeps;

// --------------------------------------------------------------------------
export const middleware =
  (config: MomentoClientConfigProps) =>
  <I, O, E, R>(wrapped: Handler<I, O, E, R | MomentoClientDeps>): Handler<I, O, E, Adapted<R>> =>
  (i: I) =>
    P.pipe(
      MomentoClientFactoryDeps,
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap((deps) =>
        P.pipe(
          wrapped(i),
          P.Effect.provideService(
            MomentoClientDeps,
            MomentoClientDeps.of({ makeMomentoClient: deps.momentoClientFactory(config) })
          )
        )
      ),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`))
    );
