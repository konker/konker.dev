import { Readable } from 'stream';

import * as unit from './utils';

describe('s3ObjectIsReadable', () => {
  it('returns true for valid S3 object response', () => {
    const mockBody = new Readable();
    const resp = {
      Body: mockBody,
    };
    expect(unit.s3ObjectIsReadable(resp)).toBe(true);
  });

  it('returns false for non-object response', () => {
    expect(unit.s3ObjectIsReadable('string')).toBe(false);
  });

  it('returns false if Body is not readable stream', () => {
    const resp = {
      Body: {},
    };
    expect(unit.s3ObjectIsReadable(resp)).toBe(false);
  });

  it('returns false for no response', () => {
    expect(unit.s3ObjectIsReadable(null)).toBe(false);
    expect(unit.s3ObjectIsReadable(undefined)).toBe(false);
  });
});
