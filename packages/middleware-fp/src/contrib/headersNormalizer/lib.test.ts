import { describe, expect, it } from 'vitest';

import * as unit from './lib.js';

export type In = { headers: Record<string, string | undefined> };

describe('middleware/headers-normalizer/lib', () => {
  describe('isWithHeaders', () => {
    it('should work as expected', () => {
      expect(unit.isWithOutputHeaders({ headers: { foo: 'abc' } })).toEqual(true);
      expect(unit.isWithOutputHeaders({ headers: {} })).toEqual(true);
      expect(unit.isWithOutputHeaders({ headers: undefined })).toEqual(false);
      expect(unit.isWithOutputHeaders({})).toEqual(false);
      expect(unit.isWithOutputHeaders('banana')).toEqual(false);
    });
  });

  describe('fromExceptionList', () => {
    it('should work as expected', () => {
      expect(unit.fromExceptionList('MIME-Version')).toEqual('MIME-Version');
      expect(unit.fromExceptionList('mime-version')).toEqual('MIME-Version');
      expect(unit.fromExceptionList('Mime-Version')).toEqual('MIME-Version');
      expect(unit.fromExceptionList('Content-type')).toEqual(undefined);
    });
  });

  describe('lowerCaseNormalizer', () => {
    it('should work as expected', () => {
      expect(unit.lowerCaseNormalizer('NAME')).toEqual('name');
      expect(unit.lowerCaseNormalizer('name')).toEqual('name');
    });
  });

  describe('canonicalNormalizer', () => {
    it('should work as expected', () => {
      expect(unit.canonicalNormalizer('SOME-HEADER')).toEqual('Some-Header');
      expect(unit.canonicalNormalizer('some-header')).toEqual('Some-Header');
      expect(unit.canonicalNormalizer('Some-Header')).toEqual('Some-Header');
      expect(unit.canonicalNormalizer('NAME')).toEqual('Name');
      expect(unit.canonicalNormalizer('name')).toEqual('Name');
      expect(unit.canonicalNormalizer('Name')).toEqual('Name');
      expect(unit.canonicalNormalizer('MIME-Version')).toEqual('MIME-Version');
      expect(unit.canonicalNormalizer('Mime-Version')).toEqual('MIME-Version');
      expect(unit.canonicalNormalizer('mime-version')).toEqual('MIME-Version');
    });
  });

  describe('normalizeKeys', () => {
    it('should work as expected', () => {
      expect(unit.normalizeKeys({ FOO: 'ABC' }, unit.lowerCaseNormalizer)).toStrictEqual({ foo: 'ABC' });
      expect(unit.normalizeKeys({ FOO: undefined }, unit.lowerCaseNormalizer)).toStrictEqual({ foo: undefined });
      expect(unit.normalizeKeys({}, unit.lowerCaseNormalizer)).toStrictEqual({});
      expect(unit.normalizeKeys(undefined, unit.lowerCaseNormalizer)).toStrictEqual({});
    });
  });

  describe('transformInput', () => {
    it('should work as expected', () => {
      expect(unit.transformInput(true)({ headers: { FOO: 'ABC' } })).toStrictEqual({
        headers: { foo: 'ABC' },
        normalizerRawInputHeaders: { FOO: 'ABC' },
      });
      expect(unit.transformInput(true)({ headers: { FOO: undefined } })).toStrictEqual({
        headers: { foo: undefined },
        normalizerRawInputHeaders: { FOO: undefined },
      });
      expect(unit.transformInput(true)({})).toStrictEqual({
        headers: {},
        normalizerRawInputHeaders: undefined,
      });
      expect(unit.transformInput(false)({ headers: { FOO: 'ABC' } })).toStrictEqual({
        headers: { FOO: 'ABC' },
        normalizerRawInputHeaders: { FOO: 'ABC' },
      });
    });
  });

  describe('transformInput', () => {
    it('should work as expected', () => {
      expect(unit.transformOutput(true)({ headers: { FOO: 'ABC' } })).toStrictEqual({
        headers: { Foo: 'ABC' },
      });
      expect(unit.transformOutput(false)({ headers: { FOO: 'ABC' } })).toStrictEqual({
        headers: { FOO: 'ABC' },
      });
      expect(unit.transformOutput(true)({})).toStrictEqual({});
      expect(unit.transformOutput(false)({})).toStrictEqual({});
    });
  });
});
