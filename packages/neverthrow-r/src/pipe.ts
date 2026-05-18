/**
 * Small value-piping `pipe` implementation, applying up to 20 unary
 * functions left-to-right with preserved inferred output types. Bundled so
 * `neverthrow-r` doesn't drag in a heavier fp library purely for `pipe`;
 * operators remain shape-compatible with any external `pipe` consumers
 * already use (`effect`, `fp-ts`, `remeda`, …).
 *
 * @module
 */

type UnaryFn<A, B> = (value: A) => B;

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
