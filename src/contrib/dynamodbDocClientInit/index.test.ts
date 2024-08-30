import * as P from '@konker.dev/effect-ts-prelude';

import { DynamoDBDocumentClientDeps, DynamoDBDocumentClientFactoryDeps } from '@konker.dev/aws-client-effect-dynamodb';

import { echoCoreInDeps } from '../../test/test-common';
import * as unit from './index';

export type In = { foo: 'foo' };

const clientDestroyMock = jest.fn();
const docClientDestroyMock = jest.fn();
const clientFactoryMock = jest.fn().mockReturnValue({ destroy: clientDestroyMock });
const docClientFactoryMock = jest.fn().mockReturnValue({ destroy: docClientDestroyMock });

const TEST_IN: In = { foo: 'foo' };
const TEST_DEPS: DynamoDBDocumentClientFactoryDeps = DynamoDBDocumentClientFactoryDeps.of({
  dynamoDBClientFactory: clientFactoryMock,
  dynamoDBDocumentClientFactory: docClientFactoryMock,
});

describe('middleware/dynamodb-doc-client-init', () => {
  it('should work as expected', async () => {
    const egHandler = P.pipe(echoCoreInDeps(DynamoDBDocumentClientDeps), unit.middleware({}));

    const result = await P.pipe(
      egHandler(TEST_IN),
      P.Effect.provideService(DynamoDBDocumentClientFactoryDeps, TEST_DEPS),
      P.Effect.runPromise
    );

    //[FIXME: is this correct? should core depend on DynamoDBDocumentClientDeps?]
    expect(result).toMatchObject({ foo: 'foo' });
    expect(result).toHaveProperty('dynamoDBDocumentClient');
    expect(clientFactoryMock).toHaveBeenCalledTimes(1);
    expect(docClientFactoryMock).toHaveBeenCalledTimes(1);
    expect(clientDestroyMock).toHaveBeenCalledTimes(1);
    expect(docClientDestroyMock).toHaveBeenCalledTimes(1);
  });
});
