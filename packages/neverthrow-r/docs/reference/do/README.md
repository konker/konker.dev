[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../README.md) / do

# do

`bind`-style do-notation for sequentially composing chains that accumulate
intermediate values into a record-shaped "scope" while threading `R`.
`doR` / `doAsyncR` seed an empty scope; `bindR` / `bindAsyncR` add a named
field, intersect the step's `R2` into the chain's requirements, and union
its error type. Ergonomic replacement for a generator-based `safeTry`.

## Functions

- [bindAsyncR](functions/bindAsyncR.md)
- [bindR](functions/bindR.md)
- [doAsyncR](functions/doAsyncR.md)
- [doR](functions/doR.md)
