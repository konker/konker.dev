[**@konker.dev/neverthrow-r-schema**](../../README.md)

***

[@konker.dev/neverthrow-r-schema](../../modules.md) / [common](../README.md) / fromStandardSchemaResult

# Function: fromStandardSchemaResult()

> **fromStandardSchemaResult**\<`O`\>(`outcome`, `options?`): `Result`\<`O`, [`SchemaValidationError`](../type-aliases/SchemaValidationError.md)\>

Defined in: [common.ts:67](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/common.ts#L67)

Converts an already-resolved Standard Schema outcome into a neverthrow
`Result`.

## Type Parameters

### O

`O`

## Parameters

### outcome

`Result`\<`O`\>

### options?

[`SchemaOptions`](../type-aliases/SchemaOptions.md)

## Returns

`Result`\<`O`, [`SchemaValidationError`](../type-aliases/SchemaValidationError.md)\>
