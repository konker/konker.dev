[**@konker.dev/neverthrow-r-schema**](../../README.md)

***

[@konker.dev/neverthrow-r-schema](../../modules.md) / [async](../README.md) / andParseAsync

# Function: andParseAsync()

> **andParseAsync**\<`I`, `O`\>(`schema`, `options?`): `AndParseAsync`\<`I`, `O`\>

Defined in: [async.ts:55](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/async.ts#L55)

Parses the success value of a plain neverthrow chain, returning a
`ResultAsync`.

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

`AndParseAsync`\<`I`, `O`\>

## Remarks

Accepts either `Result` or `ResultAsync`, so it can bridge a sync chain into
async validation or continue an already-async chain.
