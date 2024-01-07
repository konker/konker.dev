import * as P from '@konker.dev/effect-ts-prelude';

//---------------------------------------------------------------------------
// Types
export type Fact = boolean;
export type Facts = Record<string, Fact>;

export type Rule<R, C, E, F extends Facts> = (context: C, facts: F) => P.Effect.Effect<R, E, F>;

export type RuleSet<R, C, E, F extends Facts> = {
  readonly facts: F;
  readonly rules: Array<Rule<R, C, E, F>>;
};

export type RuleSetTransform<R, C, E, F extends Facts> = (ruleSet: RuleSet<R, C, E, F>) => RuleSet<R, C, E, F>;

export type RuleFunc<C, F extends Facts> = (context: C, facts: F) => boolean;

export type RuleFuncEffect<R, C, E, F extends Facts> = (context: C, facts: F) => P.Effect.Effect<R, E, boolean>;

//---------------------------------------------------------------------------
// Fact functions
export const createRuleSet = <R, C, E, F extends Facts>(initialFacts: F): RuleSet<R, C, E, F> => ({
  facts: initialFacts,
  rules: [],
});

export const setFacts = <R, C, E, F extends Facts>(ruleSet: RuleSet<R, C, E, F>, facts: F): RuleSet<R, C, E, F> => ({
  ...ruleSet,
  facts,
});

export const setFact =
  <F extends Facts>(key: keyof F, value: Fact) =>
  (facts: F): F => ({ ...facts, [key]: value });

//---------------------------------------------------------------------------
// Rule functions
export const addRule =
  <R, C, E, F extends Facts>(rule: Rule<R, C, E, F>) =>
  (ruleSet: RuleSet<R, C, E, F>): RuleSet<R, C, E, F> => ({
    ...ruleSet,
    rules: [...ruleSet.rules, rule],
  });

export const addRuleFunc = <R, C, E, F extends Facts>(
  factName: keyof F,
  ruleFunc: RuleFunc<C, F>,
  _note = ''
): RuleSetTransform<R, C, E, F> => {
  const rule = (context: C, facts: F) =>
    P.pipe(
      P.Effect.succeed(facts),
      P.Effect.map(P.pipe(ruleFunc(context, facts), (value) => setFact(factName, value)))
    );
  return addRule<R, C, E, F>(rule);
};

export const addRuleFuncEffect = <R, C, E, F extends Facts>(
  factName: keyof F,
  ruleFuncEffect: RuleFuncEffect<R, C, E, F>,
  _note = ''
): RuleSetTransform<R, C, E, F> => {
  const rule = (context: C, facts: F) =>
    P.pipe(
      ruleFuncEffect(context, facts),
      P.Effect.map((value) => P.pipe(facts, setFact(factName, value)))
    );

  return addRule(rule);
};

export const sequence =
  <R, C, E, F extends Facts>(rulesList: ReadonlyArray<RuleSetTransform<R, C, E, F>>) =>
  (ruleSet: RuleSet<R, C, E, F>): RuleSet<R, C, E, F> => {
    return rulesList.reduce((acc, ruleTransform) => ruleTransform(acc), ruleSet);
  };

//---------------------------------------------------------------------------
// Execution function
export const decide =
  <R, C, E, F extends Facts>(context: C) =>
  (ruleSet: RuleSet<R, C, E, F>): P.Effect.Effect<R, E, F> =>
    P.pipe(
      ruleSet.rules,
      P.Effect.reduce(ruleSet.facts, (facts, rule) => rule(context, facts))
    );
