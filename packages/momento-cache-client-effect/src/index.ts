import * as momento from '@gomomento/sdk';
import { Context, Option, pipe } from 'effect';
import * as Effect from 'effect/Effect';
import type { LazyArg } from 'effect/Function';

import type { MomentoClientError } from './lib/error.js';
import { toMomentoClientError } from './lib/error.js';

//------------------------------------------------------
export type MomentoClientConfigProps = {
  readonly authTokenEnvKey?: string;
  readonly loggerFactory?: momento.MomentoLoggerFactory;
  readonly configurationCtor?: (loggerFactory: momento.MomentoLoggerFactory) => momento.Configuration;
  readonly defaultTtlSeconds?: number;
};

//------------------------------------------------------
export const TAG = 'MomentoClient';

export const DEFAULT_CACHE_NAME = 'default-cache';

export const DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS: Required<MomentoClientConfigProps> = {
  authTokenEnvKey: 'MOMENTO_AUTH_TOKEN',
  loggerFactory: new momento.DefaultMomentoLoggerFactory(),
  configurationCtor: (loggerFactory: momento.MomentoLoggerFactory) =>
    momento.Configurations.InRegion.Default.latest(loggerFactory),
  defaultTtlSeconds: 60,
};

//------------------------------------------------------
export type MomentoCacheClient = LazyArg<Effect.Effect<momento.CacheClient, MomentoClientError>>;

//------------------------------------------------------
export type MomentoClientFactory = (config: MomentoClientConfigProps) => MomentoCacheClient;
export const defaultMomentoClientFactory: MomentoClientFactory = (props: MomentoClientConfigProps) => {
  const credentialProvider = new momento.EnvMomentoTokenProvider({
    environmentVariableName: props.authTokenEnvKey ?? DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS.authTokenEnvKey,
  });
  const loggerFactory = props.loggerFactory ?? DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS.loggerFactory;
  const configuration = (props.configurationCtor ?? DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS.configurationCtor)(
    loggerFactory
  );
  return () =>
    Effect.succeed(
      new momento.CacheClient({
        credentialProvider,
        configuration,
        defaultTtlSeconds: props.defaultTtlSeconds ?? DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS.defaultTtlSeconds,
      })
    );
};

//------------------------------------------------------
export type MomentoClientFactoryDeps = {
  readonly momentoClientProps: MomentoClientConfigProps;
  readonly momentoClientFactory: MomentoClientFactory;
};
export const MomentoClientFactoryDeps = Context.GenericTag<MomentoClientFactoryDeps>(
  'momento-client-fp/MomentoClientFactoryDeps'
);
export const defaultMomentoFactoryDeps = Effect.provideService(
  MomentoClientFactoryDeps,
  MomentoClientFactoryDeps.of({
    momentoClientProps: DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS,
    momentoClientFactory: defaultMomentoClientFactory,
  })
);

//------------------------------------------------------
export type MomentoClientDeps = {
  readonly makeMomentoClient: MomentoCacheClient;
};
export const MomentoClientDeps = Context.GenericTag<MomentoClientDeps>('momento-client-fp/MomentoClientDeps');

//------------------------------------------------------
// Set
export function MomentoSet(
  cacheName: string,
  key: string | Uint8Array,
  value: string | Uint8Array,
  ttlSeconds?: number
): Effect.Effect<void, MomentoClientError, MomentoClientDeps> {
  return pipe(
    MomentoClientDeps,
    Effect.flatMap((deps: MomentoClientDeps) => deps.makeMomentoClient()),
    Effect.flatMap((momentoClient) =>
      Effect.tryPromise({
        // eslint-disable-next-line fp/no-nil
        try: async () => momentoClient.set(cacheName, key, value, ttlSeconds ? { ttl: ttlSeconds } : undefined),
        catch: toMomentoClientError,
      })
    ),
    Effect.flatMap((response: momento.CacheSet.Response) => {
      if (response instanceof momento.CacheSet.Success) {
        // eslint-disable-next-line fp/no-nil
        return Effect.succeed(undefined);
      }
      return Effect.fail(toMomentoClientError(`[${TAG}] ${response.errorCode()} ${response.message()}`));
    })
  );
}

export function MomentoSetDefaultCache(
  key: string | Uint8Array,
  value: string | Uint8Array,
  ttlSeconds?: number
): Effect.Effect<void, MomentoClientError, MomentoClientDeps> {
  return MomentoSet(DEFAULT_CACHE_NAME, key, value, ttlSeconds);
}

//------------------------------------------------------
// Get
export function MomentoGet(
  cacheName: string,
  key: string | Uint8Array
): Effect.Effect<Option.Option<string>, MomentoClientError, MomentoClientDeps> {
  return pipe(
    MomentoClientDeps,
    Effect.flatMap((deps: MomentoClientDeps) => deps.makeMomentoClient()),
    Effect.flatMap((momentoClient) =>
      Effect.tryPromise({
        try: async () => momentoClient.get(cacheName, key),
        catch: toMomentoClientError,
      })
    ),
    Effect.flatMap((response: momento.CacheGet.Response) => {
      if (response instanceof momento.CacheGet.Hit) {
        return Effect.succeed(Option.some(response.valueString()));
      }
      if (response instanceof momento.CacheGet.Miss) {
        return Effect.succeed(Option.none());
      }
      return Effect.fail(toMomentoClientError(`[${TAG}] ${response.errorCode()} ${response.message()}`));
    })
  );
}

export function MomentoGetDefaultCache(
  key: string | Uint8Array
): Effect.Effect<Option.Option<string>, MomentoClientError, MomentoClientDeps> {
  return MomentoGet(DEFAULT_CACHE_NAME, key);
}

//------------------------------------------------------
// Delete
export function MomentoDel(
  cacheName: string,
  key: string | Uint8Array
): Effect.Effect<void, MomentoClientError, MomentoClientDeps> {
  return pipe(
    MomentoClientDeps,
    Effect.flatMap((deps: MomentoClientDeps) => deps.makeMomentoClient()),
    Effect.flatMap((momentoClient) =>
      Effect.tryPromise({
        try: async () => momentoClient.delete(cacheName, key),
        catch: toMomentoClientError,
      })
    ),
    Effect.flatMap((response: momento.CacheDelete.Response) => {
      if (response instanceof momento.CacheDelete.Success) {
        // eslint-disable-next-line fp/no-nil
        return Effect.succeed(undefined);
      }
      return Effect.fail(toMomentoClientError(`[${TAG}] ${response.errorCode()} ${response.message()}`));
    })
  );
}

export function MomentoDelDefaultCache(
  key: string | Uint8Array
): Effect.Effect<void, MomentoClientError, MomentoClientDeps> {
  return MomentoDel(DEFAULT_CACHE_NAME, key);
}
