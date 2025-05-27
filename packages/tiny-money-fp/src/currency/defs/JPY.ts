/* WARNING!!! THIS IS GENERATED CODE: DO NOT EDIT MANUALLY */
/* eslint-disable */

import * as NonNegativeRational from '../../lib/NonNegativeRational.js';
import * as N from '../../lib/number.js';
import { CURRENCIES } from '../Currency.js';

declare module '../Currency.js' {
  interface CURRENCIES {
    JPY: {
      symbol: 'JPY';
      scales: {
        yen: CurrencyScale;
        major: CurrencyScale;
        minor: CurrencyScale;
      };
    };
  }
}

CURRENCIES['JPY'] = {
  symbol: 'JPY',
  scales: {
    yen: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.ZERO,
    },
    major: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.ZERO,
    },
    minor: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.ZERO,
    },
  },
};
