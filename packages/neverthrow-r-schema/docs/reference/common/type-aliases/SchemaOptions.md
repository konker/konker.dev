[**@konker.dev/neverthrow-r-schema**](../../README.md)

***

[@konker.dev/neverthrow-r-schema](../../modules.md) / [common](../README.md) / SchemaOptions

# Type Alias: SchemaOptions

> **SchemaOptions** = `object`

Defined in: [common.ts:42](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/common.ts#L42)

Options shared by all helpers.

## Remarks

`message` customises normal validation failures only. Strict sync-contract
failures, thrown validators, and rejected validators keep their fixed
diagnostic messages.

`validationOptions` is passed through to `schema["~standard"].validate` by
helpers that call the validator. It is accepted but unused by
[fromStandardSchemaResult](../functions/fromStandardSchemaResult.md).

## Properties

### message?

> `readonly` `optional` **message**: `string`

Defined in: [common.ts:43](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/common.ts#L43)

***

### validationOptions?

> `readonly` `optional` **validationOptions**: `StandardSchemaV1.Options`

Defined in: [common.ts:44](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r-schema/src/common.ts#L44)
