[**@konker.dev/neverthrow-r-schema**](../../README.md)

***

[@konker.dev/neverthrow-r-schema](../../modules.md) / [sync](../README.md) / andParse

# Function: andParse()

> **andParse**\<`I`, `O`\>(`schema`, `options?`): \<`E`\>(`r`) => `Result`\<`O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md) \| `E`\>

Defined in: [sync.ts:47](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/sync.ts#L47)

Parses the success value of a plain neverthrow `Result`.

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

\<`E`\>(`r`) => `Result`\<`O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md) \| `E`\>
