[**@konker.dev/neverthrow-r**](../../README.md)

***

[@konker.dev/neverthrow-r](../../README.md) / [types](../README.md) / ExtendedScope

# Type Alias: ExtendedScope\<S, N, A\>

> **ExtendedScope**\<`S`, `N`, `A`\> = `S` *extends* `unknown` ? \{ \[K in keyof S \| N\]: K extends N ? A : K extends keyof S ? S\[K\] : never \} : `never`

Defined in: [types.ts:20](https://github.com/konker/konker.dev/blob/main/packages/neverthrow-r/src/types.ts#L20)

## Type Parameters

### S

`S` *extends* `object`

### N

`N` *extends* `string`

### A

`A`
