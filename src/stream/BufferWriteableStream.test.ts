import * as unit from './BufferWriteableStream';

describe('BufferWriteableStream', () => {
  const TEST_STRING_1 = 'hoi noi broin coi';
  const TEST_STRING_2 = 'three blind mice';

  it('should work as expected', () => {
    const actual = new unit.BufferWriteableStream();
    actual.write(TEST_STRING_1);
    actual.end();

    expect(actual.size).toEqual(TEST_STRING_1.length);
    expect(actual.string).toEqual(TEST_STRING_1);
  });

  it('should work as expected', () => {
    const actual = new unit.BufferWriteableStream();
    actual.write(TEST_STRING_2);
    actual.end();

    expect(actual.size).toEqual(TEST_STRING_2.length);
    expect(actual.string).toEqual(TEST_STRING_2);
  });
});
