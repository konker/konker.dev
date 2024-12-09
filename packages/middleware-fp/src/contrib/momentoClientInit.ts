import type { MomentoClientConfigProps } from '@konker.dev/momento-cache-client-effect';
import { MomentoClientDeps, MomentoClientFactoryDeps } from '@konker.dev/momento-cache-client-effect';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index';

const TAG = 'momentoClientInit';

export type Adapted<R> = Exclude<R, MomentoClientDeps> | MomentoClientFactoryDeps;

// --------------------------------------------------------------------------
export const middleware =
  (config: MomentoClientConfigProps) =>
  <I, O, E, R>(wrapped: Handler<I, O, E, R | MomentoClientDeps>): Handler<I, O, E, Adapted<R>> =>
  (i: I) =>
    pipe(
      MomentoClientFactoryDeps,
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap((deps) =>
        pipe(
          wrapped(i),
          Effect.provideService(
            MomentoClientDeps,
            MomentoClientDeps.of({ makeMomentoClient: deps.momentoClientFactory(config) })
          )
        )
      ),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`))
    );
