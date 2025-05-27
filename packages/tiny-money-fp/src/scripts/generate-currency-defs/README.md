# scripts/generate-currency-defs

## Introduction

The purpose of this script is to generate the code inside `src/currency/defs`.
This code basically reflects purely factual data, as taken from the [ISO4217](https://en.wikipedia.org/wiki/ISO_4217) standard.

The script is designed to be periodically run to refresh the data, but this is mostly
slow-moving data, so this perhaps can be done when a new currency is encountered in operation of the system.

ISO$217 data is derived from the [currency-codes](https://www.npmjs.com/package/currency-codes) NPM package.
Notably, the list of alpha3 currency codes.

The name of major and minor units for each currency code has been manually extracted from data in this github repo:
https://github.com/ourworldincode/currency, and stored in [data/currency-unit-names.ts](./data/currency-unit-names.ts).

A check list of currency codes which _must_ be generated is here: [data/currency-check-list.ts](./data/currency-check-list.ts).
An error is thrown if a currency is missing from this list when then code is generated.

A block list of unnecessary/undesirable currency codes is here: [data/currency-block-list.ts](./data/currency-block-list.ts).
All currencies in this list will be skipped during code generation.

## Running

```shell
$ npx ts-node ./src/scripts/generate-currency-defs
```

NOTE: The generated data is under source control, so it is prefereable to first delete the current contents of the target
directory before running the script.
