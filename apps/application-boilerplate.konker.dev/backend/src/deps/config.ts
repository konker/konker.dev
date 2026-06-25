import { ConfigProvider, Layer } from 'effect';

// --------------------------------------------------------------------------
export const ConfigProviderLive = Layer.succeed(
  ConfigProvider.ConfigProvider,
  ConfigProvider.fromEnv().pipe(ConfigProvider.constantCase)
);

// --------------------------------------------------------------------------
export const ConfigProviderTest = (testEnv: Record<string, string>) =>
  Layer.succeed(
    ConfigProvider.ConfigProvider,
    ConfigProvider.fromMap(new Map(Object.entries(testEnv))).pipe(ConfigProvider.constantCase)
  );
