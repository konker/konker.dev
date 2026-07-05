[**@konker.dev/neverthrow-r-schema**](../../README.md)

***

[@konker.dev/neverthrow-r-schema](../../modules.md) / [async](../README.md) / parseAsync

# Function: parseAsync()

> **parseAsync**\<`I`, `O`\>(`schema`, `options?`): (`input`) => `ResultAsync`\<`O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md)\>

Defined in: [async.ts:34](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/async.ts#L34)

Builds an async parser for a Standard Schema.

## Type Parameters

### I

`I`

### O

`O`

## Parameters

### schema

`StandardSchemaV1`\<`I`, `O`\>

### options?

[`SchemaOptions`](../../common/type-aliases/SchemaOptions.md)

## Returns

(`input`) => `ResultAsync`\<`O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md)\>

## Remarks

Accepts sync outcomes, promises, and thenables. Thrown validators and
rejected validations are converted into `SchemaValidationError` values.
