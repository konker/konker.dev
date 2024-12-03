import type { Cache } from './Cache';
import type { StrictSerializedCache } from './StrictSerializedCache';

export type CacheType<V, R> = Cache<V, R> | StrictSerializedCache<V, R>;
