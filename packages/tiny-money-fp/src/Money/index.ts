import type { NonEmptyArray } from 'effect/Array';

import type { CurrencySymbol } from '../currency/index.js';
import type { Money } from './Money.js';

export type NonEmptyArrayOfMoney<S extends CurrencySymbol> = S extends any ? NonEmptyArray<Money<S>> : never;

export { Money } from './Money.js';
export { fromNumber } from './from-number.js';
export { add } from './add.js';
export { sub } from './sub.js';
export { mul } from './mul.js';
export { div } from './div.js';
export { sum } from './sum.js';
