import type { Cache } from './Cache.js';
import type { StrictSerializedCache } from './StrictSerializedCache.js';

export type CacheType<V, R> = Cache<V, R> | StrictSerializedCache<V, R>;
