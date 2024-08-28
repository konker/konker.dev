import * as P from '@konker.dev/effect-ts-prelude';

import type { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';

import type { Handler } from '../../index';
import type { BaseResponse } from '../../lib/http';
import { UNKNOWN_STRING_EFFECT } from '../../lib/http';
import { toHttpApiError } from '../../lib/HttpApiError';

const TAG = 'awsApiGatewayProcessor';

// FIXME: rename Wx vars to x if used in both?
export const middleware =
  () =>
  <WI extends APIGatewayProxyEventV2, WO extends BaseResponse, WE, WR>(
    wrapped: Handler<WI, WO, WE, WR>
  ): Handler<WI, APIGatewayProxyResult, never, WR> =>
  (i: WI) => {
    return P.pipe(
      P.Effect.succeed(i),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] IN`)),
      P.Effect.flatMap(wrapped),
      P.Effect.tap(P.Effect.logDebug(`[${TAG}] OUT`)),
      P.Effect.matchEffect({
        onFailure: (e) =>
          P.pipe(
            P.Effect.succeed(e),
            P.Effect.tap(P.Effect.logError('Error', e)),
            P.Effect.map(toHttpApiError),
            P.Effect.flatMap((apiError) =>
              P.pipe(
                // Formulate response body
                { message: `${apiError.name}: ${apiError.message}`, statusCode: apiError.statusCode },
                P.Schema.encode(P.Schema.parseJson()),
                P.Effect.orElse<string, never, WR>(UNKNOWN_STRING_EFFECT),
                P.Effect.map((body) => ({
                  statusCode: apiError.statusCode,
                  headers: {
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    'Content-Type': 'application/json',
                  },
                  body,
                }))
              )
            )
          ),
        onSuccess: (o: WO) =>
          P.pipe(
            o.body,
            (body) =>
              P.Effect.if(typeof body === 'string', {
                onTrue: () => P.Effect.succeed(body as string),
                onFalse: () => P.pipe(body, P.Schema.encode(P.Schema.parseJson())),
              }),
            P.Effect.orElse<string, never, WR>(UNKNOWN_STRING_EFFECT),
            P.Effect.map((body) => ({
              statusCode: 200, // default
              ...o,
              body,
            }))
          ),
      })
    );
  };
