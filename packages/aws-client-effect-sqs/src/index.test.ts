import type {
  ChangeMessageVisibilityCommandInput,
  DeleteMessageBatchCommandInput,
  DeleteMessageCommandInput,
  ReceiveMessageCommandInput,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import * as sqsClient from '@aws-sdk/client-sqs';
import { SQSClient } from '@aws-sdk/client-sqs';
import * as P from '@konker.dev/effect-ts-prelude';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import * as unit from './index';
import { SQSClientDeps } from './index';
import { TAG } from './lib/error';

const sqsMock = mockClient(sqsClient.SQSClient);

describe('aws-client-effect-sqs', () => {
  // eslint-disable-next-line fp/no-let
  let deps: unit.SQSClientDeps;

  beforeAll(() => {
    // eslint-disable-next-line fp/no-mutation
    deps = unit.SQSClientDeps.of({
      sqsClient: new sqsClient.SQSClient({}),
    });
  });

  describe('Error tag', () => {
    it('should export as expected', () => {
      expect(unit.SQS_ERROR_TAG).toEqual('SqsError');
    });
  });

  // ------------------------------------------------------------------------
  describe('defaultSQSClientFactory', () => {
    it('should work as expected', async () => {
      expect(unit.defaultSQSClientFactory({})).toBeInstanceOf(SQSClient);
    });
  });

  // ------------------------------------------------------------------------
  describe('ChangeMessageVisibilityCommand', () => {
    beforeEach(() => {
      sqsMock.reset();
    });

    it('should work as expected', async () => {
      sqsMock.on(sqsClient.ChangeMessageVisibilityCommand).resolves({ $metadata: { httpStatusCode: 200 } });

      const params: ChangeMessageVisibilityCommandInput = {
        QueueUrl: 'https://test-queue-url',
        ReceiptHandle: 'test-receipt-handle',
        VisibilityTimeout: 123,
      };
      const expected = { $metadata: { httpStatusCode: 200 }, _Params: params };
      const command = P.pipe(
        unit.ChangeMessageVisibilityCommandEffect(params),
        P.Effect.provideService(SQSClientDeps, deps)
      );
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(sqsMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      sqsMock.on(sqsClient.ChangeMessageVisibilityCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: ChangeMessageVisibilityCommandInput = {
        QueueUrl: 'https://test-queue-url',
        ReceiptHandle: 'test-receipt-handle',
        VisibilityTimeout: 123,
      };
      const command = P.pipe(
        unit.ChangeMessageVisibilityCommandEffect(params),
        P.Effect.provideService(SQSClientDeps, deps)
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(sqsMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('DeleteMessageCommand', () => {
    beforeEach(() => {
      sqsMock.reset();
    });

    it('should work as expected', async () => {
      sqsMock.on(sqsClient.DeleteMessageCommand).resolves({ $metadata: { httpStatusCode: 200 } });

      const params: DeleteMessageCommandInput = {
        QueueUrl: 'https://test-queue-url',
        ReceiptHandle: 'test-receipt-handle',
      };
      const expected = { $metadata: { httpStatusCode: 200 }, _Params: params };
      const command = P.pipe(unit.DeleteMessageCommandEffect(params), P.Effect.provideService(SQSClientDeps, deps));
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(sqsMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      sqsMock.on(sqsClient.DeleteMessageCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: DeleteMessageCommandInput = {
        QueueUrl: 'https://test-queue-url',
        ReceiptHandle: 'test-receipt-handle',
      };
      const command = P.pipe(unit.DeleteMessageCommandEffect(params), P.Effect.provideService(SQSClientDeps, deps));
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(sqsMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('DeleteMessageBatchCommand', () => {
    beforeEach(() => {
      sqsMock.reset();
    });

    it('should work as expected', async () => {
      sqsMock.on(sqsClient.DeleteMessageBatchCommand).resolves({ $metadata: { httpStatusCode: 200 } });

      const params: DeleteMessageBatchCommandInput = {
        QueueUrl: 'https://test-queue-url',
        Entries: [{ Id: 'test-id-1', ReceiptHandle: 'test-receipt-handle-1' }],
      };
      const expected = { $metadata: { httpStatusCode: 200 }, _Params: params };
      const command = P.pipe(
        unit.DeleteMessageBatchCommandEffect(params),
        P.Effect.provideService(SQSClientDeps, deps)
      );
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(sqsMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      sqsMock.on(sqsClient.DeleteMessageBatchCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: DeleteMessageBatchCommandInput = {
        QueueUrl: 'https://test-queue-url',
        Entries: [{ Id: 'test-id-1', ReceiptHandle: 'test-receipt-handle-1' }],
      };
      const command = P.pipe(
        unit.DeleteMessageBatchCommandEffect(params),
        P.Effect.provideService(SQSClientDeps, deps)
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(sqsMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('ReceiveMessageCommand', () => {
    beforeEach(() => {
      sqsMock.reset();
    });

    it('should work as expected', async () => {
      sqsMock
        .on(sqsClient.ReceiveMessageCommand)
        .resolves({ Messages: [{ MessageId: 'test-message-id' }], $metadata: { httpStatusCode: 200 } });

      const params: ReceiveMessageCommandInput = { QueueUrl: 'https://test-queue-url', VisibilityTimeout: 123 };
      const expected = {
        Messages: [{ MessageId: 'test-message-id' }],
        $metadata: { httpStatusCode: 200 },
        _Params: params,
      };
      const command = P.pipe(unit.ReceiveMessageCommandEffect(params), P.Effect.provideService(SQSClientDeps, deps));
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(sqsMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      sqsMock.on(sqsClient.ReceiveMessageCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: ReceiveMessageCommandInput = { QueueUrl: 'https://test-queue-url', VisibilityTimeout: 123 };
      const command = P.pipe(unit.ReceiveMessageCommandEffect(params), P.Effect.provideService(SQSClientDeps, deps));
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(sqsMock.calls().length).toEqual(1);
    });
  });

  // ------------------------------------------------------------------------
  describe('SendMessageCommand', () => {
    beforeEach(() => {
      sqsMock.reset();
    });

    it('should work as expected', async () => {
      sqsMock.on(sqsClient.SendMessageCommand).resolves({ MessageId: 'test-message-id' });

      const params: SendMessageCommandInput = { QueueUrl: 'https://test-queue-url', MessageBody: 'test-message' };
      const expected = { MessageId: 'test-message-id', _Params: params };
      const command = P.pipe(unit.SendMessageCommandEffect(params), P.Effect.provideService(SQSClientDeps, deps));
      await expect(P.Effect.runPromise(command)).resolves.toStrictEqual(expected);
      expect(sqsMock.calls().length).toEqual(1);
    });

    it('should fail as expected', async () => {
      sqsMock.on(sqsClient.SendMessageCommand).rejects({ $metadata: { httpStatusCode: 404 } });

      const params: SendMessageCommandInput = { QueueUrl: 'https://test-queue-url', MessageBody: 'test-message' };
      const command = P.pipe(unit.SendMessageCommandEffect(params), P.Effect.provideService(SQSClientDeps, deps));
      await expect(P.Effect.runPromise(command)).rejects.toThrowErrorMatchingSnapshot(JSON.stringify({ _tag: TAG }));
      expect(sqsMock.calls().length).toEqual(1);
    });
  });
});
