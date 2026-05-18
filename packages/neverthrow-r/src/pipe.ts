/**
 * Left-to-right function composition. Bundled so `neverthrow-r` doesn't drag
 * in a heavier fp library purely for `pipe`; signature is shape-compatible
 * with the `pipe` used by `effect`, `fp-ts`, `remeda`, and similar.
 *
 * @remarks
 * Every combinator in this package is curried so the operand `ResultR`
 * arrives last, making `pipe` the natural composition tool: feed the seed
 * value first, then list the operators in order.
 *
 * @example
 * ```ts
 * import { okR } from '@konker.dev/neverthrow-r/constructors';
 * import { andThen, map } from '@konker.dev/neverthrow-r/sync';
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const program = pipe(
 *   okR<number>(2),
 *   map((n) => n + 1),
 *   andThen((n) => okR<string>(`got ${n}`)),
 * );
 *
 * program(undefined); // Ok('got 3')
 * ```
 *
 * @module
 */

type UnaryFn<A, B> = (value: A) => B;

/**
 * Applies a chain of unary functions left-to-right to an initial value, with
 * each function's output type inferred and propagated to the next.
 *
 * @remarks
 * Overloads are provided for chains of 0 up to 20 functions. Past 20 arities,
 * group functions with an intermediate `pipe(...)` call or extract a
 * sub-chain into a named function.
 *
 * Every {@link sync}, {@link async}, {@link bridges}, and {@link do}
 * combinator returns a unary function shaped for `pipe`, so the typical
 * pattern is `pipe(seed, op1, op2, …)`.
 *
 * @typeParam A - The initial value's type. Subsequent overloads add type
 *   parameters for each intermediate output.
 *
 * @param value - The initial value.
 * @returns The final value after all functions have been applied. With no
 *   functions, the input is returned unchanged.
 *
 * @example
 * ```ts
 * import { pipe } from '@konker.dev/neverthrow-r/pipe';
 *
 * const result = pipe(
 *   2,
 *   (n) => n + 1,
 *   (n) => n * 10,
 *   (n) => `value: ${n}`,
 * );
 * // result is 'value: 30'
 * ```
 */
export function pipe<A>(value: A): A;
export function pipe<A, B>(value: A, ab: UnaryFn<A, B>): B;
export function pipe<A, B, C>(value: A, ab: UnaryFn<A, B>, bc: UnaryFn<B, C>): C;
export function pipe<A, B, C, D>(value: A, ab: UnaryFn<A, B>, bc: UnaryFn<B, C>, cd: UnaryFn<C, D>): D;
export function pipe<A, B, C, D, E>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>
): E;
export function pipe<A, B, C, D, E, F>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>
): F;
export function pipe<A, B, C, D, E, F, G>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>
): G;
export function pipe<A, B, C, D, E, F, G, H>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>
): H;
export function pipe<A, B, C, D, E, F, G, H, I>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>
): I;
export function pipe<A, B, C, D, E, F, G, H, I, J>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>
): J;
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>
): K;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>,
  kl: UnaryFn<K, L>
): L;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>,
  kl: UnaryFn<K, L>,
  lm: UnaryFn<L, M>
): M;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>,
  kl: UnaryFn<K, L>,
  lm: UnaryFn<L, M>,
  mn: UnaryFn<M, N>
): N;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>,
  kl: UnaryFn<K, L>,
  lm: UnaryFn<L, M>,
  mn: UnaryFn<M, N>,
  no: UnaryFn<N, O>
): O;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>,
  kl: UnaryFn<K, L>,
  lm: UnaryFn<L, M>,
  mn: UnaryFn<M, N>,
  no: UnaryFn<N, O>,
  op: UnaryFn<O, P>
): P;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>,
  kl: UnaryFn<K, L>,
  lm: UnaryFn<L, M>,
  mn: UnaryFn<M, N>,
  no: UnaryFn<N, O>,
  op: UnaryFn<O, P>,
  pq: UnaryFn<P, Q>
): Q;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>,
  kl: UnaryFn<K, L>,
  lm: UnaryFn<L, M>,
  mn: UnaryFn<M, N>,
  no: UnaryFn<N, O>,
  op: UnaryFn<O, P>,
  pq: UnaryFn<P, Q>,
  qr: UnaryFn<Q, R>
): R;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>,
  kl: UnaryFn<K, L>,
  lm: UnaryFn<L, M>,
  mn: UnaryFn<M, N>,
  no: UnaryFn<N, O>,
  op: UnaryFn<O, P>,
  pq: UnaryFn<P, Q>,
  qr: UnaryFn<Q, R>,
  rs: UnaryFn<R, S>
): S;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>,
  kl: UnaryFn<K, L>,
  lm: UnaryFn<L, M>,
  mn: UnaryFn<M, N>,
  no: UnaryFn<N, O>,
  op: UnaryFn<O, P>,
  pq: UnaryFn<P, Q>,
  qr: UnaryFn<Q, R>,
  rs: UnaryFn<R, S>,
  st: UnaryFn<S, T>
): T;
export function pipe<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U>(
  value: A,
  ab: UnaryFn<A, B>,
  bc: UnaryFn<B, C>,
  cd: UnaryFn<C, D>,
  de: UnaryFn<D, E>,
  ef: UnaryFn<E, F>,
  fg: UnaryFn<F, G>,
  gh: UnaryFn<G, H>,
  hi: UnaryFn<H, I>,
  ij: UnaryFn<I, J>,
  jk: UnaryFn<J, K>,
  kl: UnaryFn<K, L>,
  lm: UnaryFn<L, M>,
  mn: UnaryFn<M, N>,
  no: UnaryFn<N, O>,
  op: UnaryFn<O, P>,
  pq: UnaryFn<P, Q>,
  qr: UnaryFn<Q, R>,
  rs: UnaryFn<R, S>,
  st: UnaryFn<S, T>,
  tu: UnaryFn<T, U>
): U;

export function pipe(value: unknown, ...fns: ReadonlyArray<UnaryFn<unknown, unknown>>): unknown {
  return fns.reduce((acc, fn) => fn(acc), value);
}
