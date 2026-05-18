[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../README.md) / types

# types

Core type aliases for the Reader-function layer: `ResultR<R, T, E>` is
`(r: R) => Result<T, E>` and `ResultAsyncR<R, T, E>` is its async sibling.
`R` defaults to `unknown` (no specific requirements). Also exposes the
`Scope` / `ExtendedScope` helpers used by do-notation and the `Simplify`
intersection-flattener.

## Type Aliases

- [ExtendedScope](type-aliases/ExtendedScope.md)
- [ResultAsyncR](type-aliases/ResultAsyncR.md)
- [ResultR](type-aliases/ResultR.md)
- [Scope](type-aliases/Scope.md)
- [Simplify](type-aliases/Simplify.md)
