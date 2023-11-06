import { NodeTinyFileSystem as unit } from './index';

describe('NodeTinyFileSystem', () => {
  describe('extname', () => {
    it('should return the file extension', () => {
      const filePath = '/path/to/file.txt';
      const expected = '.txt';
      const actual = unit.extname(filePath);
      expect(actual).toEqual(expected);
    });
  });
});
