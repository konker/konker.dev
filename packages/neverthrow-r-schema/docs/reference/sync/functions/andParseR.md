[**@konker.dev/neverthrow-r-schema**](../../README.md)

***

[@konker.dev/neverthrow-r-schema](../../modules.md) / [sync](../README.md) / andParseR

# Function: andParseR()

> **andParseR**\<`I`, `O`\>(`schema`, `options?`): \<`R`, `E`\>(`rr`) => `ResultR`\<`R`, `O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md) \| `E`\>

Defined in: [sync.ts:53](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/sync.ts#L53)

Parses the success value of a `ResultR`.

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

\<`R`, `E`\>(`rr`) => `ResultR`\<`R`, `O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md) \| `E`\>
