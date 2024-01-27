import * as P from './index';

describe('effect-prelude', () => {
  describe('ii', () => {
    function foo() {
      return 'bar';
    }

    it('should function as expected', () => {
      expect(P.ii(foo)).toEqual('bar');
    });
  });

  describe('identity', () => {
    it('should function as expected', () => {
      expect(P.identity('foo')).toEqual('foo');
    });
  });

  describe('flow', () => {
    function plusOne(n: number): number {
      return n + 1;
    }
    function timesTwo(n: number): number {
      return n * 2;
    }

    it('should function as expected', () => {
      expect(P.flow(plusOne, timesTwo)(3)).toEqual(8);
    });
  });

  describe('toError', () => {
    it('should function as expected', () => {
      const someError = new Error('SOME_ERROR');

      expect(P.toError('BANANA')).toStrictEqual(new Error('BANANA'));
      expect(P.toError({ foo: 'BAR' })).toStrictEqual(new Error('[object Object]'));
      expect(P.toError(someError)).toStrictEqual(someError);
    });
  });

  describe('Array.map', () => {
    it('should function as expected', () => {
      expect(
        P.pipe(
          [1, 2, 3],
          P.Array.map((n) => n * 2)
        )
      ).toEqual([2, 4, 6]);
    });
  });

  describe('Array.foldl', () => {
    it('should function as expected', () => {
      expect(
        P.pipe(
          [1, 2, 3],
          P.Array.foldl((acc, val) => acc + String(val), '')
        )
      ).toEqual('123');
    });
  });

  describe('Array.foldr', () => {
    it('should function as expected', () => {
      expect(
        P.pipe(
          [1, 2, 3],
          P.Array.foldr((acc, val) => acc + String(val), '')
        )
      ).toEqual('321');
    });
  });

  describe('Array.toSorted', () => {
    it('should function as expected', () => {
      expect(P.pipe([3, 1, 2], P.Array.toSorted)).toEqual([1, 2, 3]);
    });
  });

  describe('Array.toReversed', () => {
    it('should function as expected', () => {
      expect(P.pipe([1, 2, 3], P.Array.toReversed)).toEqual([3, 2, 1]);
    });
  });

  describe('Array.join', () => {
    it('should function as expected', () => {
      expect(P.pipe([1, 2, 3], P.Array.join())).toEqual('123');
      expect(P.pipe([1, 2, 3], P.Array.join('-'))).toEqual('1-2-3');
    });
  });

  describe('example usage', () => {
    function strToNum(s: string): P.Effect.Effect<never, Error, number> {
      return P.pipe(s, P.Schema.decode(P.Schema.NumberFromString), P.Effect.mapError(P.toError));
    }

    P.Console.assert(P.Effect.runSync(strToNum('1')) === 1);
  });

  describe('type test', () => {
    it('should not have any type errors', () => {
      // --------------------------------------------------------------------------
      // From: https://www.effect.website/docs/context-management/layers

      // Define the interface for the MeasuringCup service
      type MeasuringCup = {
        readonly measure: (amount: number, unit: string) => P.Effect.Effect<never, never, string>;
      };

      // Create a tag for the MeasuringCup service
      const MeasuringCup = P.Context.Tag<MeasuringCup>();

      const MeasuringCupLive: P.Layer.Layer<never, never, MeasuringCup> = P.Layer.succeed(
        MeasuringCup,
        MeasuringCup.of({
          measure: (amount, unit) => P.Effect.succeed(`Measured ${amount} ${unit}(s)`),
        })
      );

      // Sugar
      type Sugar = {
        readonly grams: (amount: number) => P.Effect.Effect<never, never, string>;
      };

      const Sugar = P.Context.Tag<Sugar>();

      const SugarLive: P.Layer.Layer<MeasuringCup, never, Sugar> = P.Layer.effect(
        Sugar,
        P.Effect.map(MeasuringCup, (measuringCup) =>
          Sugar.of({
            grams: (amount) => measuringCup.measure(amount, 'gram'),
          })
        )
      );

      // Flour
      type Flour = {
        readonly cups: (amount: number) => P.Effect.Effect<never, never, string>;
      };

      const Flour = P.Context.Tag<Flour>();

      const FlourLive: P.Layer.Layer<MeasuringCup, never, Flour> = P.Layer.effect(
        Flour,
        P.Effect.map(MeasuringCup, (measuringCup) =>
          Flour.of({
            cups: (amount) => measuringCup.measure(amount, 'cup'),
          })
        )
      );

      type Recipe = {
        readonly steps: P.Effect.Effect<never, never, ReadonlyArray<string>>;
      };

      const Recipe = P.Context.Tag<Recipe>();

      const RecipeLive: P.Layer.Layer<Sugar | Flour, never, Recipe> = P.Layer.effect(
        Recipe,
        P.Effect.all([Sugar, Flour]).pipe(
          P.Effect.map(([sugar, flour]) =>
            Recipe.of({
              steps: P.Effect.all([sugar.grams(200), flour.cups(1)]),
            })
          )
        )
      );

      const IngredientsLive: P.Layer.Layer<MeasuringCup, never, Sugar | Flour> = P.Layer.merge(FlourLive, SugarLive);

      const MainLive1: P.Layer.Layer<never, never, Recipe> = RecipeLive.pipe(
        P.Layer.provide(IngredientsLive), // provides the ingredients to the recipe
        P.Layer.provide(MeasuringCupLive) // provides the MeasuringCup to the ingredients
      );

      const RecipeDraft: P.Layer.Layer<MeasuringCup, never, Recipe> = RecipeLive.pipe(P.Layer.provide(IngredientsLive)); // provides the ingredients to the recipe

      const MainLive2: P.Layer.Layer<never, never, MeasuringCup | Recipe> = RecipeDraft.pipe(
        P.Layer.provideMerge(MeasuringCupLive)
      ); // provides the MeasuringCup to the recipe

      const MainLive3: P.Layer.Layer<never, never, Recipe> = RecipeLive.pipe(
        P.Layer.provide(IngredientsLive),
        P.Layer.provide(MeasuringCupLive)
      );

      // Just to use the variables, the actual test is the absence of type errors
      expect(MainLive1).toBeDefined();
      expect(MainLive2).toBeDefined();
      expect(MainLive3).toBeDefined();
    });
  });
});
