# @konker.dev/tiny-rules-fp

A small rules engine for [Node.js](https://nodejs.org/) based on [Effect-TS](https://www.effect.website/)

![License](https://img.shields.io/github/license/konker/konker.dev)
[![NPM Version](https://img.shields.io/npm/v/%40konker.dev%2Ftiny-rules-fp)](https://www.npmjs.com/package/@konker.dev/tiny-rules-fp)
[![codecov](https://codecov.io/gh/konker/konker.dev/graph/badge.svg?token=G0CMXHW679&flag=@konker.dev/tiny-rules-fp)](https://codecov.io/gh/konker/konker.dev?flags[0]=@konker.dev/tiny-rules-fp)

## Usage

```typescript
import * as P from '@konker.dev/effect-ts-prelude';
import * as R from 'tiny-rules-fp';

// Define a context
type TestContext = {
  readonly foo: string;
  readonly bar: number;
};

// Define a set of facts
type TestFacts = {
  readonly isFooValid: boolean;
  readonly isBarEven: boolean;
  readonly isBaz: boolean;
};

// Create a rule-set with a set of initial facts, and a set of rules
P.pipe(
  R.createRuleSet<never, TestContext, never, TestFacts>({ isFooValid: false, isBarEven: false, isBaz: true }),
  R.sequence([
    R.addRuleFunc('isFooValid', (c: TestContext, _f: TestFacts) => c.foo === 'VALID'),
    R.addRuleFuncEffect('isBarEven', (c: TestContext, _f: TestFacts) => P.Effect.succeed(c.bar % 2 === 0)),
    R.addRuleFunc('isBaz', (_c: TestContext, _f: TestFacts) => false, 'isBaz is always false'),
  ])
);

// Execute the rules with a given context to derive new facts
const facts1 = P.Effect.runSync(
  unit.decide<never, TestContext, never, TestFacts>({ foo: 'NOT VALID', bar: 15 })(TEST_RULESET_2)
);
// facts1 === { isFooValid: false, isBarEven: false, isBaz: false }

const facts2 = P.Effect.runSync(
  unit.decide<never, TestContext, never, TestFacts>({ foo: 'VALID', bar: 16 })(TEST_RULESET_2)
);
// facts2 === { isFooValid: true, isBarEven: true, isBaz: false }
```
