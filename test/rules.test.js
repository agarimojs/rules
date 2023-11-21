const fs = require('fs');
const { XBook } = require('../src');

describe('Rules', () => {
  it('should be able to load rules from excel and execute them in a context', async () => {
    const book = new XBook();
    const buffer = fs.readFileSync('./test/rules.xlsx');
    await book.read(buffer);
    const spreadsheet = book.tablesByName.Calculate;
    const person = {
      title: 'Mr.',
      name: 'John',
      measure2: 27.2,
      measure1: 'A',
      measure3: 'Yes',
    };
    const result = spreadsheet.getFn()(person);
    const expected = {
      measure2Int: 27,
      result1: ['A3', 'A4'],
      result2: ['Yes3', 'Yes4'],
      resultGlobal: ['A3', 'A4', 'Yes3', 'Yes4'],
    };
    expect(result).toEqual(expected);
  });
  it('should be able to load rules from buffer and execute them in a context', async () => {
    const book = new XBook();
    await book.read('./test/rules.xlsx');
    const spreadsheet = book.tablesByName.Calculate;
    const person = {
      title: 'Mr.',
      name: 'John',
      measure2: 27.2,
      measure1: 'A',
      measure3: 'Yes',
    };
    const result = spreadsheet.getFn()(person);
    const expected = {
      measure2Int: 27,
      result1: ['A3', 'A4'],
      result2: ['Yes3', 'Yes4'],
      resultGlobal: ['A3', 'A4', 'Yes3', 'Yes4'],
    };
    expect(result).toEqual(expected);
  });
  it('should be able to save/load rules form json and execute them in a context', async () => {
    const srcBook = new XBook();
    await srcBook.read('./test/rules.xlsx');
    const json = srcBook.toJSON();
    const book = new XBook();
    book.fromJSON(json);
    const spreadsheet = book.tablesByName.Calculate;
    const person = {
      title: 'Mr.',
      name: 'John',
      measure2: 27.2,
      measure1: 'A',
      measure3: 'Yes',
    };
    const result = spreadsheet.getFn()(person);
    const expected = {
      measure2Int: 27,
      result1: ['A3', 'A4'],
      result2: ['Yes3', 'Yes4'],
      resultGlobal: ['A3', 'A4', 'Yes3', 'Yes4'],
    };
    expect(result).toEqual(expected);
  });
  it('should be able to convert result to the RET type', async () => {
    const book = new XBook();
    await book.read('./test/rules.xlsx');
    const rule = book.tablesByName.Rule3;
    const result = rule.getFn()('B', 76);
    const expected = 60;
    expect(result).toEqual(expected);
  });
  it('Should be able to process a Multi Rules table', async () => {
    const book = new XBook();
    await book.read('./test/rules.xlsx');
    const fn = book.tablesByName.Multi1.getFn();
    let result = fn('A', 21);
    expect(result).toEqual(['A1', 'test']);
    result = fn('B', 21);
    expect(result).toEqual(['B1', 'test']);
    result = fn('A', 27);
    expect(result).toEqual(['A1', 'A2', 'test', 'C']);
    result = fn('B', 27);
    expect(result).toEqual(['B1', 'B2', 'test', 'C']);
    result = fn('A', 34);
    expect(result).toEqual(['A1', 'A2', 'A3', 'test', 'C']);
    result = fn('B', 34);
    expect(result).toEqual(['B1', 'B2', 'B3', 'test', 'C']);
    result = fn('A', 50);
    expect(result).toEqual(['A2', 'A3', 'C']);
    result = fn('B', 50);
    expect(result).toEqual(['B2', 'B3', 'C']);
    result = fn('A', 67);
    expect(result).toEqual(['A3', 'C']);
    result = fn('B', 67);
    expect(result).toEqual(['B3', 'C']);
    result = fn('A', 75);
    expect(result).toEqual(['A4', 'C']);
    result = fn('B', 75);
    expect(result).toEqual(['B4', 'C']);
    result = fn('whatever', 27);
    expect(result).toEqual(['test', 'C']);
  });
  it('Should be able to process a Multi Rules table loaded from json', async () => {
    const srcBook = new XBook();
    await srcBook.read('./test/rules.xlsx');
    const json = srcBook.toJSON();
    const book = new XBook();
    book.fromJSON(json);
    const fn = book.tablesByName.Multi1.getFn();
    let result = fn('A', 21);
    expect(result).toEqual(['A1', 'test']);
    result = fn('B', 21);
    expect(result).toEqual(['B1', 'test']);
    result = fn('A', 27);
    expect(result).toEqual(['A1', 'A2', 'test', 'C']);
    result = fn('B', 27);
    expect(result).toEqual(['B1', 'B2', 'test', 'C']);
    result = fn('A', 34);
    expect(result).toEqual(['A1', 'A2', 'A3', 'test', 'C']);
    result = fn('B', 34);
    expect(result).toEqual(['B1', 'B2', 'B3', 'test', 'C']);
    result = fn('A', 50);
    expect(result).toEqual(['A2', 'A3', 'C']);
    result = fn('B', 50);
    expect(result).toEqual(['B2', 'B3', 'C']);
    result = fn('A', 67);
    expect(result).toEqual(['A3', 'C']);
    result = fn('B', 67);
    expect(result).toEqual(['B3', 'C']);
    result = fn('A', 75);
    expect(result).toEqual(['A4', 'C']);
    result = fn('B', 75);
    expect(result).toEqual(['B4', 'C']);
    result = fn('whatever', 27);
    expect(result).toEqual(['test', 'C']);
  });
  it('should throw an error if rules contains twice the same rule', async () => {
    const book = new XBook();
    const buffer = fs.readFileSync('./test/rules-repeated.xlsx');
    await expect(book.read(buffer)).rejects.toMatchObject(
      new Error('Table Rule3 was already defined')
    );
  });
  it('should throw an error if a non valid excel is provided', async () => {
    const book = new XBook();
    const buffer = fs.readFileSync('./test/bad-rules.xlsx');
    await expect(book.read(buffer)).rejects.toMatchObject(
      new Error('Invalid excel file')
    );
  });
  it('should throw an error if rules contains a wrong method', async () => {
    const book = new XBook();
    const buffer = fs.readFileSync('./test/rules-bad-method.xlsx');
    await expect(book.read(buffer)).rejects.toMatchObject(
      new Error('Method "badMethod" does not contains a valid javascript')
    );
  });
  it('should throw an error if spreadsheet references a non existing function', async () => {
    const book = new XBook();
    const buffer = fs.readFileSync('./test/rules-bad-spreadsheet.xlsx');
    await book.read(buffer);
    const spreadsheet = book.tablesByName.Calculate;
    const person = {
      title: 'Mr.',
      name: 'John',
      measure2: 27.2,
      measure1: 'A',
      measure3: 'Yes',
    };
    const result = spreadsheet.getFn()(person);
    const expected = {
      measure2Int: 27,
      result1: ['A3', 'A4'],
      result2: ['Yes3', 'Yes4'],
      result3: undefined,
      resultGlobal: ['A3', 'A4', 'Yes3', 'Yes4'],
      errors: ['Spreadsheet formula for "result3" seems to be wrong'],
    };
    expect(result).toEqual(expected);
  });
  it('should throw an error if a table contains two empty cells of same column', async () => {
    const book = new XBook();
    const buffer = fs.readFileSync('./test/rules-two-empty-columns.xlsx');
    await expect(book.read(buffer)).rejects.toMatchObject(
      new Error('Duplicated combination at table Rule2 (variables: measure2)')
    );
  });
  it('should throw an error if a table contains two repeated row combinations', async () => {
    const book = new XBook();
    const buffer = fs.readFileSync('./test/rules-repeated-combinations.xlsx');
    await expect(book.read(buffer)).rejects.toMatchObject(
      new Error(
        'Duplicated combination at table Rule2 (variables: measure3, measure1)'
      )
    );
  });
  it('should throw an error if a table contains a double separated by comma', async () => {
    const book = new XBook();

    const buffer = fs.readFileSync('./test/rules-with-doubles-comma.xlsx');
    await expect(book.read(buffer)).rejects.toMatchObject(
      new Error('Table Rule3 contains an invalid Double/Float value')
    );
  });
});
