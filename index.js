const { XBook } = require('./src');

(async () => {
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
  console.log(result);
})();
