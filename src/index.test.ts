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

  describe('example usage', () => {
    function strToNum(s: string): P.Effect.Effect<never, Error, number> {
      return P.pipe(s, P.Schema.decode(P.Schema.NumberFromString), P.Effect.mapError(P.toError));
    }

    P.assert(P.Effect.runSync(strToNum('1')) === 1);
  });
});
