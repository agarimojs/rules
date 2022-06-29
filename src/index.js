const XBook = require('./xbook');
const bookUtils = require('./book-utils');
const DatatypeTable = require('./tables/datatype-table');
const MethodTable = require('./tables/method-table');
const RulesTable = require('./tables/rules-table');
const SpreadsheetTable = require('./tables/spreadsheet-table');

module.exports = {
  XBook,
  ...bookUtils,
  DatatypeTable,
  MethodTable,
  RulesTable,
  SpreadsheetTable,
};
