[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../README.md) / sync

# sync

Sync operators over `ResultR`: `map`, `mapErr`, `andThen`, `orElse`,
`match`, `andTee`, `orTee`, `andThrough`. Each is a one-line delegation to
the underlying neverthrow `Result` method, threading the environment `r`
and intersecting requirement types (`R1 & R2`) across composed steps.

## Functions

- [andTee](functions/andTee.md)
- [andThen](functions/andThen.md)
- [andThrough](functions/andThrough.md)
- [map](functions/map.md)
- [mapErr](functions/mapErr.md)
- [match](functions/match.md)
- [orElse](functions/orElse.md)
- [orTee](functions/orTee.md)
