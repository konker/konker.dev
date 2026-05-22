[**@konker.dev/neverthrow-r-schema**](../../README.md)

***

[@konker.dev/neverthrow-r-schema](../../modules.md) / [async](../README.md) / andParseAsyncR

# Function: andParseAsyncR()

> **andParseAsyncR**\<`I`, `O`\>(`schema`, `options?`): \<`R`, `E`\>(`rr`) => `ResultAsyncR`\<`R`, `O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md) \| `E`\>

Defined in: [async.ts:65](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/async.ts#L65)

Parses the success value of a `ResultR`, returning a `ResultAsyncR`.

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

> \<`R`, `E`\>(`rr`): `ResultAsyncR`\<`R`, `O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md) \| `E`\>

### Type Parameters

#### R

`R`

#### E

`E`

### Parameters

#### rr

`ResultR`\<`R`, `I`, `E`\>

### Returns

`ResultAsyncR`\<`R`, `O`, [`SchemaValidationError`](../../common/type-aliases/SchemaValidationError.md) \| `E`\>
