/* eslint-disable */
/**
 * Generate the currency definition code structures based on the npm package `currency-codes`
 */

import fs from 'node:fs';
import path from 'node:path';

import currencyCodes from 'currency-codes';
import Handlebars from 'handlebars';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { CURRENCY_UNIT_MAJOR, CURRENCY_UNIT_MINOR } from '../../currency/index.js';
import { CURRENCY_ALPHA3_BLOCK_LIST } from './data/currency-block-list.js';
import { CURRENCY_ALPHA3_CHECK_LIST } from './data/currency-check-list.js';
import { CURRENCY_UNIT_NAMES } from './data/currency-unit-names.js';
import { enquoteUnit, log, resolveScaleFromDigitsMajor, resolveScaleFromDigitsMinor } from './helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATE_DIR = path.join(__dirname, 'templates');
const TEMPLATE_FILE_PATH_ALPHA3 = path.join(TEMPLATE_DIR, 'defs_alpha3.hbs');
const TEMPLATE_FILE_PATH_INDEX = path.join(TEMPLATE_DIR, 'defs_index.hbs');

const DEFS_DIR = path.join(__dirname, '..', '..', 'currency', 'defs');

Handlebars.registerHelper('enquoteUnit', enquoteUnit);

async function main() {
  log('Creating template context...');

  const alpha3s = currencyCodes.codes();

  const currencyData = alpha3s.reduce((acc, val) => {
    if (CURRENCY_ALPHA3_BLOCK_LIST.includes(val)) {
      log(`WARN: ${val} found on block list, skipping.`);
      return acc;
    }

    const unitNames = CURRENCY_UNIT_NAMES[val];
    if (!unitNames) {
      log(`WARN: No unit names found for ${val}, skipping.`);
      return acc;
    }
    const def = currencyCodes.code(val);
    if (!def) {
      throw new Error(`ERROR: No iso4217 data found for: ${val}, aborting.`);
    }

    const units = [
      resolveScaleFromDigitsMajor(def, unitNames.major),
      resolveScaleFromDigitsMajor(def, CURRENCY_UNIT_MAJOR),
    ];
    if (def.digits > 0) {
      units.push(resolveScaleFromDigitsMinor(def, unitNames.minor));
      units.push(resolveScaleFromDigitsMinor(def, CURRENCY_UNIT_MINOR));
    } else {
      // There is only major unit, so the minor unit is the same as the major unit
      units.push(resolveScaleFromDigitsMajor(def, CURRENCY_UNIT_MINOR));
    }

    acc.push({
      symbol: val,
      units,
    });
    return acc;
  }, [] as any);

  const symbols = currencyData.map((x: any) => x.symbol);

  // Check all currencies on the check-list are included
  const missingChecklistCurrencies: Array<string> = [];
  CURRENCY_ALPHA3_CHECK_LIST.forEach((checkListCurrency) => {
    if (!symbols.includes(checkListCurrency)) {
      missingChecklistCurrencies.push(checkListCurrency);
    }
  });
  if (missingChecklistCurrencies.length > 0) {
    throw new Error(`Missing check-list currencies found: ${missingChecklistCurrencies}, aborting.`);
  }
  log('Check-list PASSED');

  log(`Loading templates from ${TEMPLATE_DIR}`);
  const hbsStrAlpha3 = await fs.promises.readFile(TEMPLATE_FILE_PATH_ALPHA3);
  const hbsStrIndex = await fs.promises.readFile(TEMPLATE_FILE_PATH_INDEX);
  const hbsAlpha3 = Handlebars.compile(hbsStrAlpha3.toString());
  const hbsIndex = Handlebars.compile(hbsStrIndex.toString());

  // Write individual currency def files
  log(`Target defs directory: ${DEFS_DIR}`);
  for (const currency of currencyData) {
    const code = hbsAlpha3({ currency });
    const fileName = `${currency.symbol}.ts`;
    const targetPath = path.join(DEFS_DIR, fileName);

    log(`Writing alpha3 def file: ${targetPath}`);
    await fs.promises.writeFile(targetPath, code);
  }

  // Write the index file
  const indexCode = hbsIndex({ symbols });
  const indexTargetPath = path.join(DEFS_DIR, 'index.ts');
  log(`Writing def index file: ${indexTargetPath}`);
  await fs.promises.writeFile(indexTargetPath, indexCode);

  log('FINISHED');
}

main().catch(console.log);
