/* WARNING!!! THIS IS GENERATED CODE: DO NOT EDIT MANUALLY */
/* eslint-disable */

import * as NonNegativeRational from '../../lib/NonNegativeRational.js';
import * as N from '../../lib/number.js';
import { CURRENCIES } from '../Currency.js';

declare module '../Currency.js' {
  interface CURRENCIES {
    TND: {
      symbol: 'TND';
      scales: {
        dinar: CurrencyScale;
        major: CurrencyScale;
        millime: CurrencyScale;
        minor: CurrencyScale;
      };
    };
  }
}

CURRENCIES['TND'] = {
  symbol: 'TND',
  scales: {
    dinar: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.THREE,
    },
    major: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.THREE,
    },
    millime: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_THOUSAND),
      decimals: N.ZERO,
    },
    minor: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_THOUSAND),
      decimals: N.ZERO,
    },
  },
};
