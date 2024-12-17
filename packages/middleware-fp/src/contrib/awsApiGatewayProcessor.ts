import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';
import { pipe, Schema } from 'effect';
import * as Effect from 'effect/Effect';

import type { Handler } from '../index.js';
import type { BaseResponse } from '../lib/http.js';
import { UNKNOWN_STRING_EFFECT } from '../lib/http.js';
import { toHttpApiError } from '../lib/HttpApiError.js';

const TAG = 'awsApiGatewayProcessor';

export const middleware =
  () =>
  <I extends APIGatewayProxyEventV2, O extends BaseResponse, E, R>(
    wrapped: Handler<I, O, E, R>
  ): Handler<I, APIGatewayProxyResult, never, R> =>
  (i: I) => {
    return pipe(
      Effect.succeed(i),
      Effect.tap(Effect.logDebug(`[${TAG}] IN`)),
      Effect.flatMap(wrapped),
      Effect.tap(Effect.logDebug(`[${TAG}] OUT`)),
      Effect.matchEffect({
        onFailure: (e) =>
          pipe(
            Effect.succeed(e),
            Effect.tap(Effect.logError('Error', e)),
            Effect.map(toHttpApiError),
            Effect.flatMap((apiError) =>
              pipe(
                // Formulate response body
                { message: `${apiError.name}: ${apiError.message}`, statusCode: apiError.statusCode },
                Schema.encode(Schema.parseJson()),
                Effect.orElse<string, never, R>(UNKNOWN_STRING_EFFECT),
                Effect.map((body) => ({
                  statusCode: apiError.statusCode,
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body,
                }))
              )
            )
          ),
        onSuccess: (o: O) =>
          pipe(
            o.body,
            (body) =>
              Effect.if(typeof body === 'string', {
                onTrue: () => Effect.succeed(body as string),
                onFalse: () => pipe(body, Schema.encode(Schema.parseJson())),
              }),
            Effect.orElse<string, never, R>(UNKNOWN_STRING_EFFECT),
            Effect.map((body) => ({
              statusCode: 200, // default
              ...o,
              body,
            }))
          ),
      })
    );
  };
