[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../README.md) / bridges

# bridges

Sync→async bridge operators that take a `ResultR` and return a
`ResultAsyncR`: `asyncMap`, `asyncAndThen`, `asyncAndThrough`. They follow
the same `R1 & R2` intersection rule as the pure sync/async operators,
promoting the chain to the async track.

## Functions

- [asyncAndThen](functions/asyncAndThen.md)
- [asyncAndThrough](functions/asyncAndThrough.md)
- [asyncMap](functions/asyncMap.md)
