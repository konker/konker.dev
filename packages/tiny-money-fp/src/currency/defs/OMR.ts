/* WARNING!!! THIS IS GENERATED CODE: DO NOT EDIT MANUALLY */
/* eslint-disable */

import * as NonNegativeRational from '../../lib/NonNegativeRational.js';
import * as N from '../../lib/number.js';
import { CURRENCIES } from '../Currency.js';

declare module '../Currency.js' {
  interface CURRENCIES {
    OMR: {
      symbol: 'OMR';
      scales: {
        rial: CurrencyScale;
        major: CurrencyScale;
        baisa: CurrencyScale;
        minor: CurrencyScale;
      };
    };
  }
}

CURRENCIES['OMR'] = {
  symbol: 'OMR',
  scales: {
    rial: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.THREE,
    },
    major: {
      multiplier: NonNegativeRational.ONE_RATIONAL,
      decimals: N.THREE,
    },
    baisa: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_THOUSAND),
      decimals: N.ZERO,
    },
    minor: {
      multiplier: NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_THOUSAND),
      decimals: N.ZERO,
    },
  },
};
