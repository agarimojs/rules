const Excel = require('exceljs');
const RulesTable = require('./tables/rules-table');
const DatatypeTable = require('./tables/datatype-table');
const SpreadsheetTable = require('./tables/spreadsheet-table');
const {
  coord2excel,
  getRect,
  getCellText,
  splitBlock,
} = require('./book-utils');
const MethodTable = require('./tables/method-table');

class XBook {
  constructor() {
    this.tables = [];
    this.tablesByName = {};
  }

  processSheet(sheet) {
    const rect = getRect(sheet);
    let pendingBlocks = [];
    let currentBlock = [];
    for (let j = rect.top; j <= rect.bottom; j += 1) {
      const currentRow = [];
      currentBlock.push(currentRow);
      for (let i = rect.left; i <= rect.right; i += 1) {
        const cellRef = coord2excel({ row: j - 1, column: i - 1 });
        currentRow.push(getCellText(sheet.getCell(cellRef)));
      }
    }
    pendingBlocks.push(currentBlock);
    let modified = true;
    while (modified) {
      modified = false;
      const oldBlocks = pendingBlocks;
      pendingBlocks = [];
      for (let i = 0; i < oldBlocks.length; i += 1) {
        currentBlock = oldBlocks[i];
        const newBlocks = splitBlock(currentBlock);
        if (newBlocks.length > 1 && !modified) {
          modified = true;
        }
        for (let j = 0; j < newBlocks.length; j += 1) {
          pendingBlocks.push(newBlocks[j]);
        }
      }
    }
    for (let i = 0; i < pendingBlocks.length; i += 1) {
      this.tables.push(pendingBlocks[i]);
    }
  }

  buildTable(tableType, table) {
    switch (tableType) {
      case 'Rules':
        return new RulesTable(this, table);
      case 'Multi':
        return new RulesTable(this, table, true);
      case 'Datatype':
        return new DatatypeTable(this, table);
      case 'Spreadsheet':
        return new SpreadsheetTable(this, table);
      case 'Method':
        return new MethodTable(this, table);
      default:
        return undefined;
    }
  }

  async read(filename) {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile(filename);
    workbook.eachSheet((worksheet) => {
      this.processSheet(worksheet);
    });
    for (let i = 0; i < this.tables.length; i += 1) {
      const table = this.tables[i];
      const title = table[0][0].trim();
      const tableType = title.split(' ')[0].trim();
      const builtTable = this.buildTable(tableType, table);
      if (builtTable) {
        this.tables[i] = builtTable;
        this.tablesByName[builtTable.name] = builtTable;
      }
    }
  }
}

module.exports = XBook;
