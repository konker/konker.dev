/* WARNING!!! THIS IS GENERATED CODE: DO NOT EDIT MANUALLY */
/* eslint-disable */

import * as NonNegativeRational from '../../lib/NonNegativeRational.js';
import * as N from '../../lib/number.js';
import { CURRENCIES } from '../Currency.js';

declare module '../Currency.js' {
  interface CURRENCIES {
    LYD: {
      symbol: 'LYD';
      scales: {
        dinar: CurrencyScale;
        major: CurrencyScale;
        dirham: CurrencyScale;
        minor: CurrencyScale;
      };
    };
  }
}

CURRENCIES['LYD'] = {
  symbol: 'LYD',
  scales: {
    dinar: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.THREE,
    },
    major: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.THREE,
    },
    dirham: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_THOUSAND),
      decimals: N.ZERO,
    },
    minor: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_THOUSAND),
      decimals: N.ZERO,
    },
  },
};
