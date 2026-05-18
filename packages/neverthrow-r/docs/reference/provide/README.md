[**@konker.dev/neverthrow-r**](../README.md)

***

[@konker.dev/neverthrow-r](../README.md) / provide

# provide

Provision: supply the environment to a `ResultR` / `ResultAsyncR` and
obtain the underlying neverthrow value. `provide(rr, deps)` is the named
alias for `rr(deps)` with explicit type narrowing. `provideSome(rr, p)`
whole-replaces a subset of requirement keys and returns a `ResultR` over
the remaining ones (no deep merge).

## Functions

- [provide](functions/provide.md)
- [provideSome](functions/provideSome.md)
