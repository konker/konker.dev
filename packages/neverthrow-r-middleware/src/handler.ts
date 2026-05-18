import type { ResultAsyncR } from '@konker.dev/neverthrow-r/types';

export type Handler<I, O, E, R> = (i: I) => ResultAsyncR<R, O, E>;
