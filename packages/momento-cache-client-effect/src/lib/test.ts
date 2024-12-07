/* eslint-disable fp/no-mutation,fp/no-nil,@typescript-eslint/naming-convention */
import * as momento from '@gomomento/sdk';
import * as P from '@konker.dev/effect-ts-prelude';
import { TextEncoder } from 'util';

import type { MomentoClientConfigProps, MomentoClientFactory } from '../index.js';
import { DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS, MomentoClientDeps, MomentoClientFactoryDeps } from '../index.js';

// Taken from: https://github.com/momentohq/client-sdk-javascript/blob/main/packages/client-sdk-nodejs/test/unit/cache-client.test.ts
export const TEST_MOMENTO_AUTH_TOKEN =
  'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJzcXVpcnJlbCIsImNwIjoiY29udHJvbCBwbGFuZSBlbmRwb2ludCIsImMiOiJkYXRhIHBsYW5lIGVuZHBvaW50In0.zsTsEXFawetTCZI';

export const ERROR_KEY = 'ERROR_KEY';
export const EXCEPTION_KEY = 'EXCEPTION_KEY';

export const TEXT_ENCODER = new TextEncoder();

// --------------------------------------------------------------------------
export const MockMomentoClient = (__cache: any = {}) =>
  ({
    __cache,
    get: jest.fn(async (cacheName: string, key: string) => {
      // eslint-disable-next-line fp/no-throw
      if (key === EXCEPTION_KEY) throw new Error('GET KABOOM!');
      return key === ERROR_KEY
        ? new momento.CacheGet.Error(new momento.UnknownError('GET BOOM!'))
        : __cache[`${cacheName}_${key}`] === undefined
          ? new momento.CacheGet.Miss()
          : new momento.CacheGet.Hit(TEXT_ENCODER.encode(__cache[`${cacheName}_${key}`]));
    }),
    set: jest.fn(async (cacheName: string, key: string, value: string, _options: any) => {
      // eslint-disable-next-line fp/no-throw
      if (key === EXCEPTION_KEY) throw new Error('SET KABOOM!');
      if (key === ERROR_KEY) return new momento.CacheSet.Error(new momento.UnknownError('SET BOOM!'));
      __cache[`${cacheName}_${key}`] = value;
      return new momento.CacheSet.Success();
    }),
    delete: jest.fn(async (cacheName: string, key: string) => {
      // eslint-disable-next-line fp/no-throw
      if (key === EXCEPTION_KEY) throw new Error('DEL KABOOM!');
      if (key === ERROR_KEY) return new momento.CacheDelete.Error(new momento.UnknownError('DEL BOOM!'));
      __cache[`${cacheName}_${key}`] = undefined;
      return new momento.CacheDelete.Success();
    }),
  }) as unknown as momento.CacheClient & { __cache: any };

// --------------------------------------------------------------------------
export const mockMomentoClientEffect =
  (__cache: any = {}) =>
  () =>
    P.Effect.succeed(MockMomentoClient(__cache));

export const mockMomentoClientFactory =
  (__cache: any = {}): MomentoClientFactory =>
  (_props: MomentoClientConfigProps) => {
    return mockMomentoClientEffect(__cache);
  };

export const mockMomentoClientFactoryDeps = (__cache: any = {}) =>
  P.Effect.provideService(
    MomentoClientFactoryDeps,
    MomentoClientFactoryDeps.of({
      momentoClientProps: DEFAULT_MOMENTO_CLIENT_CONFIG_PROPS,
      momentoClientFactory: mockMomentoClientFactory(__cache),
    })
  );

export const mockMomentoClientDeps = (__cache: any = {}) =>
  P.Effect.provideService(
    MomentoClientDeps,
    MomentoClientDeps.of({
      makeMomentoClient: mockMomentoClientEffect(__cache),
    })
  );
