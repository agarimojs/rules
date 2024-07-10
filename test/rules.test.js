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
    const expected = 60.6;
    expect(result).toEqual(expected);
  });
  it('should be able to check that the returned value belongs to RET type domain', async () => {
    const book = new XBook();
    await book.read('./test/rules-bad-doubles.xlsx');
    const rule = book.tablesByName.Rule4;
    const action = () => rule.getFn()('B', 51);
    expect(action).toThrow('Invalid Float/Double 40-50');
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
  it('should return an error if one test has an incorrect case', async () => {
    const book = new XBook();
    await book.read('./test/rules-tests1.xlsx');
    const expected = [
      'Test Rule3TestInverted failed at row 2. Expected 3.2 but got 3.3',
    ];
    const actual = await book.test();
    expect(actual).toEqual(expected);
  });
  it('should return several errors if one test has several incorrect cases', async () => {
    const book = new XBook();
    await book.read('./test/rules-tests2.xlsx');
    const expected = [
      'Test Rule3TestInverted failed at row 2. Expected 3.2 but got 3.3',
      'Test Rule3TestInverted failed at row 3. Expected 5.3 but got 5.5',
    ];
    const actual = await book.test();
    expect(actual).toEqual(expected);
  });
  it('should return several errors if several tests has several incorrect cases', async () => {
    const book = new XBook();
    await book.read('./test/rules-tests3.xlsx');
    const expected = [
      'Test Rule3TestInverted failed at row 2. Expected 3.2 but got 3.3',
      'Test Rule3TestInverted failed at row 3. Expected 5.3 but got 5.5',
      'Test Rule3Test failed at row 2. Expected 100 but got 3.3',
    ];
    const actual = await book.test();
    expect(actual).toEqual(expected);
  });
  it('should pass all tests if all are correct', async () => {
    const book = new XBook();
    await book.read('./test/rules.xlsx');
    const expected = [];
    const actual = await book.test({ RuleCheck: () => [] });
    expect(actual).toEqual(expected);
  });
  it('Should return error if a Table has values that not match the return type', async () => {
    const book = new XBook();
    await book.read('./test/rules-bad-doubles.xlsx');
    const expected = [
      'Table Rule4 has return type Double but it contains non-float values (e.g.: 20-30)',
    ];
    const actual = await book.test();
    expect(actual).toEqual(expected);
  });
  it('should execute checks', async () => {
    const book = new XBook();
    await book.read('./test/rules.xlsx');
    const checkFunction = (items, tableName, checkName) =>
      items
        .filter((item) => item.startsWith('B'))
        .map(
          (item) =>
            `Item ${item} not found in ${tableName} from Check ${checkName}`
        );
    const expected = [
      'Item B1 not found in Rule1 from Check RuleCheck',
      'Item B2 not found in Rule1 from Check RuleCheck',
      'Item B3 not found in Rule1 from Check RuleCheck',
      'Item B4 not found in Rule1 from Check RuleCheck',
      'Item B5 not found in Rule1 from Check RuleCheck',
      'Item B6 not found in Rule1 from Check RuleCheck',
      'Item B7 not found in Rule1 from Check RuleCheck',
    ];
    const actual = await book.test({ RuleCheck: checkFunction });
    expect(actual).toEqual(expected);
  });
});
