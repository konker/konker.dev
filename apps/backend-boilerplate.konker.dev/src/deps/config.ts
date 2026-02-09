import { PlatformConfigProvider } from '@effect/platform';
import { NodeFileSystem } from '@effect/platform-node';
import { Effect, Layer } from 'effect';

// --------------------------------------------------------------------------
export const EnvProviderLayer = Layer.unwrapEffect(
  PlatformConfigProvider.fromDotEnv('.env').pipe(
    Effect.map(Layer.setConfigProvider),
    Effect.provide(NodeFileSystem.layer)
  )
);
