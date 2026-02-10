import { PlatformConfigProvider } from '@effect/platform';
import { NodeFileSystem } from '@effect/platform-node';
import { ConfigProvider, Effect, Layer } from 'effect';

// --------------------------------------------------------------------------
export const ConfigProviderLive = Layer.succeed(
  ConfigProvider.ConfigProvider,
  ConfigProvider.fromEnv().pipe(ConfigProvider.constantCase)
);

// --------------------------------------------------------------------------
export const ConfigProviderTest = Layer.unwrapEffect(
  PlatformConfigProvider.fromDotEnv('.env').pipe(
    Effect.map(Layer.setConfigProvider),
    Effect.provide(NodeFileSystem.layer)
  )
);
