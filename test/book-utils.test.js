const {
  ALPHACHARS,
  isAlphaChar,
  alphaIndex,
  alpha2number,
  number2alpha,
  excel2coord,
  coord2excel,
  excel2range,
} = require('../src');

describe('Book Utils', () => {
  describe('alphaIndex', () => {
    test('Should return the index of an uppercase alpha character', () => {
      for (let i = 0, l = ALPHACHARS.length; i < l; i += 1) {
        expect(alphaIndex(ALPHACHARS[i])).toEqual(i);
      }
      expect(alphaIndex('A')).toEqual(0);
      expect(alphaIndex('Z')).toEqual(25);
    });
    test('Should return -1 if the character is lowercase', () => {
      expect(alphaIndex('a')).toEqual(-1);
      expect(alphaIndex('z')).toEqual(-1);
    });
    test('Should return -1 if the character is not an alpha', () => {
      expect(alphaIndex('.')).toEqual(-1);
      expect(alphaIndex('*')).toEqual(-1);
      expect(alphaIndex('1')).toEqual(-1);
    });
  });
  describe('isAlphaChar', () => {
    test('Should return true if is an uppercase alpha character', () => {
      for (let i = 0, l = ALPHACHARS.length; i < l; i += 1) {
        expect(isAlphaChar(ALPHACHARS[i])).toBeTruthy();
      }
      expect(isAlphaChar('A')).toBeTruthy();
      expect(isAlphaChar('Z')).toBeTruthy();
    });
    test('Should return false if the character is lowercase', () => {
      expect(isAlphaChar('a')).toBeFalsy();
      expect(isAlphaChar('z')).toBeFalsy();
    });
    test('Should return false if the character is not an alpha', () => {
      expect(isAlphaChar('.')).toBeFalsy();
      expect(isAlphaChar('*')).toBeFalsy();
      expect(isAlphaChar('1')).toBeFalsy();
    });
  });
  describe('alpha2number', () => {
    test('Should return correct number for one character', () => {
      expect(alpha2number('A')).toEqual(0);
      expect(alpha2number('Z')).toEqual(25);
    });
    test('Should return correct number for several characters', () => {
      expect(alpha2number('AA')).toEqual(26);
      expect(alpha2number('AZ')).toEqual(51);
      expect(alpha2number('BA')).toEqual(52);
      expect(alpha2number('ZZ')).toEqual(701);
      expect(alpha2number('AAA')).toEqual(702);
    });
    test('Should throw exception if invalid alpha', () => {
      expect(() => alpha2number('12')).toThrow('Invalid alpha');
    });
  });
  describe('number2alpha', () => {
    test('Should return correct alpha value for number', () => {
      expect(number2alpha(0)).toEqual('A');
      expect(number2alpha(25)).toEqual('Z');
      expect(number2alpha(26)).toEqual('AA');
      expect(number2alpha(51)).toEqual('AZ');
      expect(number2alpha(52)).toEqual('BA');
      expect(number2alpha(701)).toEqual('ZZ');
      expect(number2alpha(702)).toEqual('AAA');
      expect(number2alpha(1378)).toEqual('BAA');
      expect(number2alpha(1379)).toEqual('BAB');
      expect(number2alpha(18278)).toEqual('AAAA');
      expect(number2alpha(475254)).toEqual('AAAAA');
      expect(number2alpha(12356630)).toEqual('AAAAAA');
    });
    test('Should throw an error if its not a valid number', () => {
      expect(() => number2alpha('A')).toThrow('Invalid number');
    });
    test('Should throw an error if its not a negative number', () => {
      expect(() => number2alpha(-10)).toThrow('Number cannot be negative');
    });
  });
  describe('excel2coord', () => {
    test('Should return correct coordinates', () => {
      let result = excel2coord('A1');
      expect(result).toBeDefined();
      expect(result.column).toEqual(0);
      expect(result.row).toEqual(0);
      result = excel2coord('AAAAAA123456');
      expect(result).toBeDefined();
      expect(result.column).toEqual(12356630);
      expect(result.row).toEqual(123455);
    });
  });
  describe('coord2excel', () => {
    test('Should return correct excel coordinates', () => {
      let result = coord2excel({ column: 0, row: 0 });
      expect(result).toEqual('A1');
      result = coord2excel({ column: 12356630, row: 123455 });
      expect(result).toEqual('AAAAAA123456');
    });
  });
  describe('excel2range', () => {
    test('Should return correct range', () => {
      const result = excel2range('A1:AAAAAA123456');
      expect(result).toBeDefined();
      expect(result.topleft).toBeDefined();
      expect(result.bottomright).toBeDefined();
      expect(result.topleft.column).toEqual(0);
      expect(result.topleft.row).toEqual(0);
      expect(result.bottomright.column).toEqual(12356630);
      expect(result.bottomright.row).toEqual(123455);
    });
    test('If is not a range raises an error', () => {
      expect(() => excel2range('A1B2')).toThrow('Invalid excel range');
    });
  });
});
