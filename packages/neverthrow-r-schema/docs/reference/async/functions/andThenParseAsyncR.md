[**@konker.dev/neverthrow-r-schema**](../../README.md)

***

[@konker.dev/neverthrow-r-schema](../../modules.md) / [async](../README.md) / andThenParseAsyncR

# Function: andThenParseAsyncR()

> **andThenParseAsyncR**\<`I`, `O`\>(`schema`, `options?`): \<`R`, `E`\>(`rr`) => `ResultAsyncR`\<`R`, `O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md) \| `E`\>

Defined in: [async.ts:75](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/async.ts#L75)

Parses the success value of a `ResultAsyncR`, preserving the async reader
chain.

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

\<`R`, `E`\>(`rr`) => `ResultAsyncR`\<`R`, `O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md) \| `E`\>
