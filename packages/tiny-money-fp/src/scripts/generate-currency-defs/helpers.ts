/* eslint-disable fp/no-nil,fp/no-throw,fp/no-unused-expression,fp/no-rest-parameters */
import type currencyCodes from 'currency-codes';

export const TAG = 'generate-currency-defs';

export function log(...args: Array<unknown>) {
  console.log(`[${TAG}]`, ...args);
}

export function resolveDecimalsFromN(n: number) {
  switch (n) {
    case 0:
      return 'N.ZERO';
    case 1:
      return 'N.ONE';
    case 2:
      return 'N.TWO';
    case 3:
      return 'N.THREE';
    default:
      throw new Error(`[${TAG}] ERROR: Could not resolve decimals for: ${n}.`);
  }
}

export function resolveMultiplierFromN(n: number) {
  switch (n) {
    case 2:
      return 'NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_HUNDRED)';
    case 3:
      return 'NonNegativeRational.NonNegativeRational(N.ONE, N.NAT_ONE_THOUSAND)';
    default:
      throw new Error(`[${TAG}] ERROR: Could not resolve multiplier for: ${n}.`);
  }
}

export function resolveScaleFromDigitsMajor(def: currencyCodes.CurrencyCodeRecord, unit: string) {
  return {
    unit,
    multiplier: 'NonNegativeRational.ONE_RATIONAL',
    decimals: resolveDecimalsFromN(def.digits),
  };
}

export function resolveScaleFromDigitsMinor(def: currencyCodes.CurrencyCodeRecord, unit: string) {
  return {
    unit,
    multiplier: resolveMultiplierFromN(def.digits),
    decimals: 'N.ZERO',
  };
}

export function enquoteUnit(alpha3: string): string {
  if (/'/.exec(alpha3)) {
    return `"${alpha3}"`;
  } else if (/ /.exec(alpha3)) {
    return `'${alpha3}'`;
  }
  return alpha3;
}
