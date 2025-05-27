/* WARNING!!! THIS IS GENERATED CODE: DO NOT EDIT MANUALLY */
/* eslint-disable */

import * as NonNegativeRational from '../../lib/NonNegativeRational.js';
import * as N from '../../lib/number.js';
import { CURRENCIES } from '../Currency.js';

declare module '../Currency.js' {
  interface CURRENCIES {
    PGK: {
      symbol: 'PGK';
      scales: {
        kina: CurrencyScale;
        major: CurrencyScale;
        toea: CurrencyScale;
        minor: CurrencyScale;
      };
    };
  }
}

CURRENCIES['PGK'] = {
  symbol: 'PGK',
  scales: {
    kina: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.TWO,
    },
    major: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.TWO,
    },
    toea: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_HUNDRED),
      decimals: N.ZERO,
    },
    minor: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_HUNDRED),
      decimals: N.ZERO,
    },
  },
};
