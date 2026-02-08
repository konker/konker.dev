import type { MomentoClientConfigProps } from '@konker.dev/momento-cache-client-effect';
import { MomentoClientDeps, MomentoClientFactoryDeps } from '@konker.dev/momento-cache-client-effect';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';

import type { Rec, RequestResponseHandler } from '../index.js';
import type { RequestW } from '../RequestW.js';

const TAG = 'momentoClientInit';

export type Adapted<R> = Exclude<R, MomentoClientDeps> | MomentoClientFactoryDeps;

// --------------------------------------------------------------------------
export const middleware =
  (config: MomentoClientConfigProps) =>
  <I extends Rec, O extends Rec, E, R>(
    wrapped: RequestResponseHandler<I, O, E, R | MomentoClientDeps>
  ): RequestResponseHandler<I, O, E, Adapted<R>> =>
  (i: RequestW<I>) =>
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
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`)),
      Effect.withSpan(TAG)
    );
