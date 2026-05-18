[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../README.md) / pipe

# pipe

Small value-piping `pipe` implementation, applying up to 20 unary
functions left-to-right with preserved inferred output types. Bundled so
`neverthrow-r` doesn't drag in a heavier fp library purely for `pipe`;
operators remain shape-compatible with any external `pipe` consumers
already use (`effect`, `fp-ts`, `remeda`, …).

## Functions

- [pipe](functions/pipe.md)
