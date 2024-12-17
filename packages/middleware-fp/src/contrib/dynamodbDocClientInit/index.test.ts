import {
  DynamoDBDocumentClientDeps,
  DynamoDBDocumentClientFactoryDeps,
} from '@konker.dev/aws-client-effect-dynamodb/lib/client';
import { pipe } from 'effect';
import * as Effect from 'effect/Effect';
import { describe, expect, it, vi } from 'vitest';

import { echoCoreInDeps } from '../../test/test-common.js';
import * as unit from './index.js';

export type In = { foo: 'foo' };

const clientDestroyMock = vi.fn();
const docClientDestroyMock = vi.fn();
const clientFactoryMock = vi.fn().mockReturnValue({ destroy: clientDestroyMock });
const docClientFactoryMock = vi.fn().mockReturnValue({ destroy: docClientDestroyMock });

const TEST_IN: In = { foo: 'foo' };
const TEST_DEPS: DynamoDBDocumentClientFactoryDeps = DynamoDBDocumentClientFactoryDeps.of({
  dynamoDBClientFactory: clientFactoryMock,
  dynamoDBDocumentClientFactory: docClientFactoryMock,
});

describe('middleware/dynamodb-doc-client-init', () => {
  it('should work as expected', async () => {
    const egHandler = pipe(echoCoreInDeps(DynamoDBDocumentClientDeps), unit.middleware({}));

    const result = await pipe(
      egHandler(TEST_IN),
      Effect.provideService(DynamoDBDocumentClientFactoryDeps, TEST_DEPS),
      Effect.runPromise
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
