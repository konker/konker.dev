import * as P from '@konker.dev/effect-ts-prelude';

import type { PublishCommandInput } from '@aws-sdk/client-sns';
import * as snsClient from '@aws-sdk/client-sns';
import { SNSClient } from '@aws-sdk/client-sns';
import { mockClient } from 'aws-sdk-client-mock';

import * as unit from './index';
import { SNSClientDeps } from './index';
import { TAG } from './lib/error';

const snsMock = mockClient(snsClient.SNSClient);

describe('aws-client-effect-sns', () => {
  // eslint-disable-next-line fp/no-let
  let deps: unit.SNSClientDeps;

  beforeAll(() => {
    // eslint-disable-next-line fp/no-mutation
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
  describe('PublishCommand', () => {
    beforeEach(() => {
      snsMock.reset();
    });

    it('should work as expected', async () => {
      snsMock.on(snsClient.PublishCommand).resolves({ MessageId: 'test-message-id' });

      const params: PublishCommandInput = { TopicArn: 'test-topic-arn', Message: 'test-message' };
      const expected = { MessageId: 'test-message-id', _Params: params };
      const command = P.pipe(unit.PublishCommandEffect(params), P.Effect.provideService(SNSClientDeps, deps));
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(snsMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      snsMock.on(snsClient.PublishCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: PublishCommandInput = { TopicArn: 'test-topic-arn', Message: 'test-message' };
      const command = P.pipe(unit.PublishCommandEffect(params), P.Effect.provideService(SNSClientDeps, deps));
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(snsMock.calls().length).toEqual(1);
    });
  });
});
