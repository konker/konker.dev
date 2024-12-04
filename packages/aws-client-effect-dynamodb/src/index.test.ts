import * as P from '@konker.dev/effect-ts-prelude';

import * as dynamodbLib from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

import * as unit from './index';
import { defaultDynamoDBDocumentClientDeps } from './lib/client';

const ddbMock = mockClient(dynamodbLib.DynamoDBDocumentClient);

describe('aws-client-effect-dynamodb', () => {
  // ------------------------------------------------------------------------
  describe('GetCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.GetCommand).resolves({
        Item: { id: 'user1', name: 'John' },
      });

      const params = { TableName: 't1', Key: {} };
      const command = P.pipe(unit.GetCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Item: { id: 'user1', name: 'John' },
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.GetCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.GetCommandEffect({ TableName: 't1', Key: {} }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('PutCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.PutCommand).resolves({ Attributes: { foo: 'bar' } });

      const params = { TableName: 't1', Item: {} };
      const command = P.pipe(unit.PutCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Attributes: { foo: 'bar' },
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.PutCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.PutCommandEffect({ TableName: 't1', Item: {} }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('UpdateCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.UpdateCommand).resolves({ Attributes: { foo: 'bar' } });

      const params = { TableName: 't1', Key: {} };
      const command = P.pipe(unit.UpdateCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Attributes: { foo: 'bar' },
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.UpdateCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.UpdateCommandEffect({ TableName: 't1', Key: {} }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('DeleteCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.DeleteCommand).resolves({ Attributes: { foo: 'bar' } });

      const params = { TableName: 't1', Key: {} };
      const command = P.pipe(unit.DeleteCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Attributes: { foo: 'bar' },
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.DeleteCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.DeleteCommandEffect({ TableName: 't1', Key: {} }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('QueryCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.QueryCommand).resolves({ Items: [{ foo: 'bar' }] });

      const params = { TableName: 't1', IndexName: 'fooIndex' };
      const command = P.pipe(unit.QueryCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Items: [{ foo: 'bar' }],
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.QueryCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.QueryCommandEffect({ TableName: 't1', IndexName: 'fooIndex' }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('ScanCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.ScanCommand).resolves({ Items: [{ foo: 'bar' }] });

      const params = { TableName: 't1', IndexName: 'fooIndex' };
      const command = P.pipe(unit.ScanCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Items: [{ foo: 'bar' }],
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.ScanCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.ScanCommandEffect({ TableName: 't1', IndexName: 'fooIndex' }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('BatchGetCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.BatchGetCommand).resolves({ Responses: { t1: [{ foo: 'bar' }] } });

      const params = { RequestItems: { t1: { Keys: [{ foo: 'bar' }] } } };
      const command = P.pipe(unit.BatchGetCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Responses: { t1: [{ foo: 'bar' }] },
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.BatchGetCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.BatchGetCommandEffect({ RequestItems: { t1: { Keys: [{ foo: 'bar' }] } } }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('BatchWriteCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.BatchWriteCommand).resolves({ UnprocessedItems: {} });

      const params = { RequestItems: { t1: [{ PutRequest: { Item: {} } }] } };
      const command = P.pipe(unit.BatchWriteCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        UnprocessedItems: {},
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.BatchWriteCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.BatchWriteCommandEffect({ RequestItems: { t1: [{ PutRequest: { Item: {} } }] } }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('TransactGetCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.TransactGetCommand).resolves({ Responses: [{ Item: { foo: 'bar' } }] });

      const params = { TransactItems: [{ Get: { TableName: 't1', Key: {} } }] };
      const command = P.pipe(unit.TransactGetCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Responses: [{ Item: { foo: 'bar' } }],
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.TransactGetCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.TransactGetCommandEffect({ TransactItems: [{ Get: { TableName: 't1', Key: {} } }] }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('TransactWriteCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.TransactWriteCommand).resolves({ ItemCollectionMetrics: {} });

      const params = { TransactItems: [{ Put: { TableName: 't1', Item: {} } }] };
      const command = P.pipe(unit.TransactWriteCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        ItemCollectionMetrics: {},
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.TransactWriteCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.TransactWriteCommandEffect({ TransactItems: [{ Put: { TableName: 't1', Item: {} } }] }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('ExecuteStatementCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock.on(dynamodbLib.ExecuteStatementCommand).resolves({ Items: [{ foo: 'bar' }] });

      const params = {
        Statement: 'SELECT * FROM t1 where foo=?',
        Parameters: [{ S: 'bar' }],
      };
      const command = P.pipe(unit.ExecuteStatementCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Items: [{ foo: 'bar' }],
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.ExecuteStatementCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.ExecuteStatementCommandEffect({
          Statement: 'SELECT * FROM t1 where foo=?',
          Parameters: [{ S: 'bar' }],
        }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('ExecuteTransactionCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock
        .on(dynamodbLib.ExecuteTransactionCommand)
        .resolves({ Responses: [{ Item: [{ foo: 'bar' }, { foo: 'baz' }] }] });

      const params = {
        TransactStatements: [
          {
            Statement: 'SELECT * FROM t1 where foo=?',
            Parameters: [{ S: 'bar' }],
          },
          {
            Statement: 'SELECT * FROM t1 where foo=?',
            Parameters: [{ S: 'baz' }],
          },
        ],
      };
      const command = P.pipe(unit.ExecuteTransactionCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Responses: [{ Item: [{ foo: 'bar' }, { foo: 'baz' }] }],
        _Params: params,
      });
    });

    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.ExecuteTransactionCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.ExecuteTransactionCommandEffect({
          TransactStatements: [
            {
              Statement: 'SELECT * FROM t1 where foo=?',
              Parameters: [{ S: 'bar' }],
            },
            {
              Statement: 'SELECT * FROM t1 where foo=?',
              Parameters: [{ S: 'baz' }],
            },
          ],
        }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });

  // ------------------------------------------------------------------------
  describe('BatchExecuteStatementCommand', () => {
    beforeEach(() => {
      ddbMock.reset();
    });

    it('should work as expected', async () => {
      ddbMock
        .on(dynamodbLib.BatchExecuteStatementCommand)
        .resolves({ Responses: [{ Item: [{ foo: 'bar' }, { foo: 'baz' }] }] });

      const params = {
        Statements: [
          {
            Statement: 'SELECT * FROM t1 where foo=?',
            Parameters: [{ S: 'bar' }],
          },
          {
            Statement: 'SELECT * FROM t1 where foo=?',
            Parameters: [{ S: 'baz' }],
          },
        ],
      };
      const command = P.pipe(unit.BatchExecuteStatementCommandEffect(params), defaultDynamoDBDocumentClientDeps({}));
      expect(await P.Effect.runPromise(command)).toStrictEqual({
        Responses: [{ Item: [{ foo: 'bar' }, { foo: 'baz' }] }],
        _Params: params,
      });
    });

    // FIXME: skipped?
    xit('should fail as expected', async () => {
      ddbMock.on(dynamodbLib.BatchExecuteStatementCommand).rejects('BOOM!');

      const command = P.pipe(
        unit.BatchExecuteStatementCommandEffect({
          Statements: [
            {
              Statement: 'SELECT * FROM t1 where foo=?',
              Parameters: [{ S: 'bar' }],
            },
            {
              Statement: 'SELECT * FROM t1 where foo=?',
              Parameters: [{ S: 'baz' }],
            },
          ],
        }),
        defaultDynamoDBDocumentClientDeps({})
      );
      await expect(P.Effect.runPromise(command)).rejects.toThrow('BOOM!');
    });
  });
});
