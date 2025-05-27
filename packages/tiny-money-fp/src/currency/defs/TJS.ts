/* WARNING!!! THIS IS GENERATED CODE: DO NOT EDIT MANUALLY */
/* eslint-disable */

import * as NonNegativeRational from '../../lib/NonNegativeRational.js';
import * as N from '../../lib/number.js';
import { CURRENCIES } from '../Currency.js';

declare module '../Currency.js' {
  interface CURRENCIES {
    TJS: {
      symbol: 'TJS';
      scales: {
        somoni: CurrencyScale;
        major: CurrencyScale;
        diram: CurrencyScale;
        minor: CurrencyScale;
      };
    };
  }
}

CURRENCIES['TJS'] = {
  symbol: 'TJS',
  scales: {
    somoni: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.TWO,
    },
    major: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.TWO,
    },
    diram: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_HUNDRED),
      decimals: N.ZERO,
    },
    minor: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_HUNDRED),
      decimals: N.ZERO,
    },
  },
};
