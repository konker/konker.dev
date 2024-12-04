/* eslint-disable @typescript-eslint/naming-convention */
import * as unit from './utils';

describe('utils', () => {
  describe('objectToUpdateAttributes', () => {
    it('should work as expected', () => {
      expect(unit.objectToUpdateAttributes({})).toStrictEqual({});
      expect(unit.objectToUpdateAttributes({ foo: 'bar', baz: 123, qux: false })).toStrictEqual({
        foo: { Value: 'bar' },
        baz: { Value: 123 },
        qux: { Value: false },
      });
      expect(
        unit.objectToUpdateAttributes({ foo: 'bar', baz: 123, qux: false, mal: undefined, bol: null })
      ).toStrictEqual({
        foo: { Value: 'bar' },
        baz: { Value: 123 },
        qux: { Value: false },
        bol: { Value: null },
      });
    });
  });

  describe('objectToUpdateExpression', () => {
    it('should work as expected', () => {
      expect(unit.objectToUpdateExpression({})).toBe('');
      expect(unit.objectToUpdateExpression({ foo: 'bar', baz: 123, qux: false })).toBe(
        'SET #foo = :foo, #baz = :baz, #qux = :qux'
      );
      expect(unit.objectToUpdateExpression({ foo: 'bar', baz: 123, qux: false, mal: undefined, bol: null })).toBe(
        'SET #foo = :foo, #baz = :baz, #qux = :qux, #bol = :bol'
      );
    });
  });

  describe('objectToUpdateExpressionNames', () => {
    it('should work as expected', () => {
      expect(unit.objectToUpdateExpressionNames({})).toStrictEqual({});
      expect(unit.objectToUpdateExpressionNames({ foo: 'bar', baz: 123, qux: false })).toStrictEqual({
        '#foo': 'foo',
        '#baz': 'baz',
        '#qux': 'qux',
      });
      expect(
        unit.objectToUpdateExpressionNames({ foo: 'bar', baz: 123, qux: false, mal: undefined, bol: null })
      ).toStrictEqual({
        '#foo': 'foo',
        '#baz': 'baz',
        '#qux': 'qux',
        '#bol': 'bol',
      });
    });
  });

  describe('objectToUpdateExpressionValues', () => {
    it('should work as expected', () => {
      expect(unit.objectToUpdateExpressionValues({})).toStrictEqual({});
      expect(unit.objectToUpdateExpressionValues({ foo: 'bar', baz: 123, qux: false })).toStrictEqual({
        ':foo': 'bar',
        ':baz': 123,
        ':qux': false,
      });
      expect(
        unit.objectToUpdateExpressionValues({ foo: 'bar', baz: 123, qux: false, mal: undefined, bol: null })
      ).toStrictEqual({
        ':foo': 'bar',
        ':baz': 123,
        ':qux': false,
        ':bol': null,
      });
    });
  });
});
