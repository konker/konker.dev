import type { PublishCommandInput } from '@aws-sdk/client-sns';
import * as snsClient from '@aws-sdk/client-sns';
import { SNSClient } from '@aws-sdk/client-sns';
import { mockClient } from 'aws-sdk-client-mock';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import * as unit from './index.js';
import { SNSClientDeps } from './index.js';
import { TAG } from './lib/error.js';

const snsMock = mockClient(snsClient.SNSClient);

describe('aws-client-effect-sns', () => {
  let deps: unit.SNSClientDeps;

  beforeAll(() => {
    deps = unit.SNSClientDeps.of({
      snsClient: new snsClient.SNSClient({}),
    });
  });

  describe('Error tag', () => {
    it('should export as expected', () => {
      expect(unit.SNS_ERROR_TAG).toEqual('SnsError');
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultSNSClientFactory', () => {
    it('should work as expected', async () => {
      expect(unit.defaultSNSClientFactory({})).toBeInstanceOf(SNSClient);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultSNSClientFactoryDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = pipe(
        unit.SNSClientFactoryDeps,
        Effect.map((deps) => deps.snsClientFactory),
        unit.defaultSNSClientFactoryDeps
      );
      const actual = Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(Function);
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultSNSClientDeps', () => {
    it('should work as expected', async () => {
      const actualEffect = pipe(
        unit.SNSClientDeps,
        Effect.map((deps) => deps.snsClient),
        unit.defaultSNSClientDeps({})
      );
      const actual = Effect.runSync(actualEffect);
      expect(actual).toBeInstanceOf(SNSClient);
    });
  });

  // ------------------------------------------------------------------------
  describe('PublishCommand', () => {
    beforeEach(() => {
      snsMock.reset();
    });

    it('should work as expected', async () => {
      snsMock.on(snsClient.PublishCommand).resolves({ MessageId: 'test-message-id' });

      const params: PublishCommandInput = { TopicArn: 'test-topic-arn', Message: 'test-message' };
      const expected = { MessageId: 'test-message-id', _Params: params };
      const command = pipe(unit.PublishCommandEffect(params), Effect.provideService(SNSClientDeps, deps));
      await expect(Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(snsMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      snsMock.on(snsClient.PublishCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: PublishCommandInput = { TopicArn: 'test-topic-arn', Message: 'test-message' };
      const command = pipe(unit.PublishCommandEffect(params), Effect.provideService(SNSClientDeps, deps));
      await expect(Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(snsMock.calls().length).toEqual(1);
    });
  });
});
