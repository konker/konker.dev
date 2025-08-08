import type * as dynamodbDocClient from '@aws-sdk/lib-dynamodb';

/**
 * Convert a given model into a DynamoDB DocClient UpdateAttributes object
 *
 * @param o
 */
export function objectToUpdateAttributes(
  o: Record<string, unknown>
): NonNullable<dynamodbDocClient.UpdateCommandInput['AttributeUpdates']> {
  return Object.keys(o).reduce(
    (acc, val) => {
      if (o[val] === undefined) return acc;

      return {
        ...acc,
        [val]: { Value: o[val] },
      };
    },
    {} as NonNullable<dynamodbDocClient.UpdateCommandInput['AttributeUpdates']>
  );
}

/**
 * Convert the given model into a DynamoDB DocClient UpdateExpression object
 *
 * @param o
 */
export function objectToUpdateExpression(o: Record<string, unknown>): string {
  const updates = Object.keys(o).reduce((acc, val) => {
    if (o[val] === undefined) return acc;

    return acc.concat([`#${val} = :${val}`]);
  }, [] as Array<string>);

  return updates.length > 0 ? `SET ${updates.join(', ')}` : '';
}

/**
 * Convert the given model into a DynamoDB DocClient ExpressionAttributeNames object
 *
 * @param o
 */
export function objectToUpdateExpressionNames(o: Record<string, unknown>): Record<string, string> {
  return Object.keys(o).reduce(
    (acc, val) => {
      if (o[val] === undefined) return acc;

      return {
        ...acc,
        [`#${val}`]: val,
      };
    },
    {} as Record<string, string>
  );
}

/**
 * Convert the given model into a DynamoDB DocClient ExpressionAttributeValues object
 *
 * @param o
 */
export function objectToUpdateExpressionValues(o: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(o).reduce(
    (acc, val) => {
      if (o[val] === undefined) return acc;

      return {
        ...acc,
        [`:${val}`]: o[val],
      };
    },
    {} as Record<string, unknown>
  );
}
