/* WARNING!!! THIS IS GENERATED CODE: DO NOT EDIT MANUALLY */
/* eslint-disable */

import * as NonNegativeRational from '../../lib/NonNegativeRational.js';
import * as N from '../../lib/number.js';
import { CURRENCIES } from '../Currency.js';

declare module '../Currency.js' {
  interface CURRENCIES {
    EGP: {
      symbol: 'EGP';
      scales: {
        pound: CurrencyScale;
        major: CurrencyScale;
        qirsh: CurrencyScale;
        minor: CurrencyScale;
      };
    };
  }
}

CURRENCIES['EGP'] = {
  symbol: 'EGP',
  scales: {
    pound: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.TWO,
    },
    major: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.TWO,
    },
    qirsh: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_HUNDRED),
      decimals: N.ZERO,
    },
    minor: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_HUNDRED),
      decimals: N.ZERO,
    },
  },
};
