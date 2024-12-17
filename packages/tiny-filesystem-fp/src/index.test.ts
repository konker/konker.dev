import { describe, expect, it } from 'vitest';

import * as unit from './index.js';

describe('index', () => {
  describe('fileTypeIsDirectory', () => {
    it('should work as expected', () => {
      expect(unit.fileTypeIsDirectory(unit.FileType.Directory)).toEqual(true);
      expect(unit.fileTypeIsDirectory(unit.FileType.File)).toEqual(false);
      expect(unit.fileTypeIsDirectory(unit.FileType.Other)).toEqual(false);
    });
  });

  describe('fileTypeIsFile', () => {
    it('should work as expected', () => {
      expect(unit.fileTypeIsFile(unit.FileType.Directory)).toEqual(false);
      expect(unit.fileTypeIsFile(unit.FileType.File)).toEqual(true);
      expect(unit.fileTypeIsFile(unit.FileType.Other)).toEqual(false);
    });
  });

  describe('fileTypeIsOther', () => {
    it('should work as expected', () => {
      expect(unit.fileTypeIsOther(unit.FileType.Directory)).toEqual(false);
      expect(unit.fileTypeIsOther(unit.FileType.File)).toEqual(false);
      expect(unit.fileTypeIsOther(unit.FileType.Other)).toEqual(true);
    });
  });
});
