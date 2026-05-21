import type { ResultAsyncR } from '@konker.dev/neverthrow-r/types';

export type Handler<I, R, O, E> = (i: I) => ResultAsyncR<R, O, E>;
