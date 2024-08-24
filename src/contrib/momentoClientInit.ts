import * as P from '@konker.dev/effect-ts-prelude';

import type { MomentoClientConfigProps } from '@konker.dev/momento-cache-client-effect';
import { MomentoClientDeps, MomentoClientFactoryDeps } from '@konker.dev/momento-cache-client-effect';

import type { Handler } from '../index';

const TAG = 'momento-client-init';

// --------------------------------------------------------------------------
export const middleware =
  (config: MomentoClientConfigProps) =>
  <WI, WO, WE, WR>(
    wrapped: Handler<WI, WO, WE, WR | MomentoClientDeps>
  ): Handler<WI, WO, WE, Exclude<WR, MomentoClientDeps> | MomentoClientFactoryDeps> =>
  (i: WI) =>
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
