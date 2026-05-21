[**@konker.dev/neverthrow-r-schema**](../../README.md)

***

[@konker.dev/neverthrow-r-schema](../../modules.md) / [sync](../README.md) / parse

# Function: parse()

> **parse**\<`I`, `O`\>(`schema`, `options?`): (`input`) => `Result`\<`O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md)\>

Defined in: [sync.ts:30](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/sync.ts#L30)

Builds a sync parser for a Standard Schema.

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

> (`input`): `Result`\<`O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md)\>

### Parameters

#### input

`I`

### Returns

`Result`\<`O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md)\>

## Remarks

Use this only with schemas whose `validate` method returns synchronously. If
validation returns a promise or thenable, the result is an `Err` with
[ASYNC\_SCHEMA\_MESSAGE](../../common/variables/ASYNC_SCHEMA_MESSAGE.md).
