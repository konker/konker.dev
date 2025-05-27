/* WARNING!!! THIS IS GENERATED CODE: DO NOT EDIT MANUALLY */
/* eslint-disable */

import * as NonNegativeRational from '../../lib/NonNegativeRational.js';
import * as N from '../../lib/number.js';
import { CURRENCIES } from '../Currency.js';

declare module '../Currency.js' {
  interface CURRENCIES {
    CNY: {
      symbol: 'CNY';
      scales: {
        yuan: CurrencyScale;
        major: CurrencyScale;
        fen: CurrencyScale;
        minor: CurrencyScale;
      };
    };
  }
}

CURRENCIES['CNY'] = {
  symbol: 'CNY',
  scales: {
    yuan: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.TWO,
    },
    major: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.TWO,
    },
    fen: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_HUNDRED),
      decimals: N.ZERO,
    },
    minor: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_HUNDRED),
      decimals: N.ZERO,
    },
  },
};
