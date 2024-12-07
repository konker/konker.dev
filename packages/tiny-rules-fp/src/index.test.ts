import * as P from '@konker.dev/effect-ts-prelude';
import type { TestContext } from 'effect';
import { describe, expect, it } from 'vitest';

import * as unit from './index';

type TestContext = {
  readonly foo: string;
  readonly bar: number;
};

type TestFacts = {
  readonly isFooValid: boolean;
  readonly isBarEven: boolean;
  readonly isBaz: boolean;
};

const TEST_FACTS: TestFacts = {
  isFooValid: true,
  isBarEven: false,
  isBaz: false,
} as const;

const TEST_RULESET_1 = unit.createRuleSet<never, TestContext, never, TestFacts>(TEST_FACTS);
const TEST_RULESET_2 = P.pipe(
  TEST_RULESET_1,
  unit.sequence([
    unit.addRuleFunc('isFooValid', (c: TestContext, _f: TestFacts) => c.foo === 'VALID'),
    unit.addRuleFuncEffect('isBarEven', (c: TestContext, _f: TestFacts) => P.Effect.succeed(c.bar % 2 === 0)),
    unit.addRuleFunc('isBaz', (_c: TestContext, _f: TestFacts) => false, 'isBaz is always false'),
  ])
);

describe('tiny-rules-fp', () => {
  describe('createRuleSet', () => {
    it('should be work as expected', () => {
      const result = unit.createRuleSet(TEST_FACTS);
      expect(result).toStrictEqual({
        facts: TEST_FACTS,
        rules: [],
      });
    });
  });

  describe('setFacts', () => {
    it('should be work as expected', () => {
      const result = unit.setFacts(TEST_RULESET_1, { isFooValid: false, isBarEven: false, isBaz: false });
      expect(result).toStrictEqual({
        facts: { isFooValid: false, isBarEven: false, isBaz: false },
        rules: [],
      });
    });
  });

  describe('setFact', () => {
    it('should be work as expected', () => {
      const result = unit.setFact('isFooValid', false)(TEST_FACTS);
      expect(result).toStrictEqual({ isFooValid: false, isBarEven: false, isBaz: false });
    });
  });

  describe('addRuleFunc', () => {
    it('should be work as expected', () => {
      const result = unit.addRuleFunc(
        'isFooValid',
        (c: TestContext, _f: TestFacts) => c.foo === 'VALID',
        ''
      )(TEST_RULESET_1);
      expect(result.facts).toStrictEqual(TEST_FACTS);
      expect(result.rules).toHaveLength(1);
    });
  });

  describe('addRuleFuncEffect', () => {
    it('should be work as expected', () => {
      const result = unit.addRuleFuncEffect(
        'isFooValid',
        (c: TestContext, _f: TestFacts) => P.Effect.succeed(c.foo === 'VALID'),
        ''
      )(TEST_RULESET_1);
      expect(result.facts).toStrictEqual(TEST_FACTS);
      expect(result.rules).toHaveLength(1);
    });
  });

  describe('sequence', () => {
    it('should be work as expected', () => {
      const result = P.pipe(
        TEST_RULESET_1,
        unit.sequence([
          unit.addRuleFunc('isFooValid', (c: TestContext, _f: TestFacts) => c.foo === 'VALID', ''),
          unit.addRuleFunc('isBarEven', (c: TestContext, _f: TestFacts) => c.bar % 2 === 0, ''),
          unit.addRuleFunc('isBaz', (_c: TestContext, _f: TestFacts) => false, 'isBaz is always false'),
        ])
      );
      expect(result.facts).toStrictEqual(TEST_FACTS);
      expect(result.rules).toHaveLength(3);
    });
  });

  describe('decide', () => {
    it('should be work as expected', () => {
      const result = P.Effect.runSync(
        unit.decide<never, TestContext, never, TestFacts>({ foo: 'VALID', bar: 16 })(TEST_RULESET_2)
      );
      expect(result).toStrictEqual({
        isFooValid: true,
        isBarEven: true,
        isBaz: false,
      });
    });

    it('should be work as expected', () => {
      const result = P.Effect.runSync(
        unit.decide<never, TestContext, never, TestFacts>({ foo: 'NOT VALID', bar: 15 })(TEST_RULESET_2)
      );
      expect(result).toStrictEqual({
        isFooValid: false,
        isBarEven: false,
        isBaz: false,
      });
    });
  });
});
