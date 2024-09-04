const Excel = require('exceljs');
const RulesTable = require('./tables/rules-table');
const DatatypeTable = require('./tables/datatype-table');
const SpreadsheetTable = require('./tables/spreadsheet-table');
const ConstantsTable = require('./tables/constants-table');
const {
  coord2excel,
  getRect,
  getCellText,
  splitBlock,
  isNumber,
  isInteger,
  toValue,
} = require('./book-utils');
const MethodTable = require('./tables/method-table');
const TestTable = require('./tables/test-table');
const CheckTable = require('./tables/check-table');

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
      case 'Constants':
        return new ConstantsTable(this, table);
      case 'Test':
        return new TestTable(this, table);
      case 'Check':
        return new CheckTable(this, table);
      default:
        return undefined;
    }
  }

  async read(filename) {
    const workbook = new Excel.Workbook();
    try {
      if (typeof filename === 'string') {
        await workbook.xlsx.readFile(filename);
      } else {
        await workbook.xlsx.load(filename);
      }
    } catch (err) {
      throw new Error(`Invalid excel file`);
    }
    workbook.eachSheet((worksheet) => {
      this.processSheet(worksheet);
    });
    for (let i = 0; i < this.tables.length; i += 1) {
      const table = this.tables[i];
      // eslint-disable-next-line no-continue
      if (table.length === 0) continue;
      const title = table[0][0].trim();
      const tableType = title.split(' ')[0].trim();
      const builtTable = this.buildTable(tableType, table);
      if (builtTable) {
        this.tables[i] = builtTable;
        if (this.tablesByName[builtTable.name]) {
          throw new Error(`Table ${builtTable.name} was already defined`);
        }
        this.tablesByName[builtTable.name] = builtTable;
      }
    }
    this.buildDefaultContext();
  }

  toJSON() {
    return this.tables.map((table) =>
      Array.isArray(table) ? table : table.toJSON()
    );
  }

  getInstanceOf(className) {
    switch (className) {
      case 'RulesTable':
        return new RulesTable(this);
      case 'DatatypeTable':
        return new DatatypeTable(this);
      case 'SpreadsheetTable':
        return new SpreadsheetTable(this);
      case 'MethodTable':
        return new MethodTable(this);
      case 'ConstantsTable':
        return new ConstantsTable(this);
      case 'TestTable':
        return new TestTable(this);
      case 'CheckTable':
        return new CheckTable(this);
      default:
        return undefined;
    }
  }

  fromJSON(json) {
    this.tables = [];
    this.tablesByName = {};
    for (let i = 0; i < json.length; i += 1) {
      const current = json[i];
      if (current.className) {
        const instance = this.getInstanceOf(current.className);
        instance.fromJSON(current);
        this.tables.push(instance);
        this.tablesByName[instance.name] = instance;
      } else {
        this.tables.push(current);
      }
    }
    this.buildDefaultContext();
  }

  buildDefaultContext() {
    this.defaultContext = {};
    this.defaultContext.Math = Math;
    this.defaultContext.console = console;
    this.defaultContext.Date = Date;
    for (let i = 0; i < this.tables.length; i += 1) {
      const table = this.tables[i];
      if (table instanceof ConstantsTable) {
        for (let j = 0; j < table.params.length; j += 1) {
          const param = table.params[j];
          this.defaultContext[param.name] = param.value;
        }
      } else if (table.name) {
        this.defaultContext[table.name] = table.getFn ? table.getFn() : table;
      }
    }
  }

  buildContext(params, args) {
    const context = { ...this.defaultContext };
    if (params) {
      for (let i = 0; i < params.length; i += 1) {
        const { name } = params[i];
        context[name] = args[i];
      }
    }
    return context;
  }

  checkReturns() {
    const tables = this.tables.filter((table) => table instanceof RulesTable);
    const errors = [];
    for (let i = 0; i < tables.length; i += 1) {
      const table = tables[i];
      const returnType = table.returnParam?.type;
      if (['Integer', 'Float', 'Double'].includes(returnType)) {
        const values = table.matrix.flat();
        for (let j = 0; j < values.length; j += 1) {
          if (values[j]) {
            if (returnType === 'Integer' && !isInteger(values[j])) {
              errors.push(
                `Table ${table.name} has return type Integer but it contains non-integer values`
              );
              break;
            } else if (!isNumber(values[j])) {
              errors.push(
                `Table ${table.name} has return type ${table.returnParam.type} but it contains non-float values (e.g.: ${values[j]})`
              );
              break;
            }
          }
        }
      }
    }
    return errors;
  }

  async executeCheckTables(checkFunctions) {
    const tables = this.tables.filter((table) => table instanceof CheckTable);
    const errors = [];
    for (let i = 0; i < tables.length; i += 1) {
      const table = tables[i];
      const checkFunction = checkFunctions[table.name];
      if (checkFunction) {
        for (let j = 0; j < table.tableNames.length; j += 1) {
          const tableName = table.tableNames[j];
          const refTable = this.tablesByName[tableName];
          if (!refTable) {
            errors.push(
              `Table ${tableName} from Check Table ${table.name} not found`
            );
            // eslint-disable-next-line no-continue
            continue;
          }

          const items = refTable.matrix
            .flat()
            .filter((item) => item)
            .map((item) => {
              const value = toValue(refTable.returnParam?.type, item);
              return Array.isArray(value) ? value : value.split('\n');
            })
            .flat();
          // eslint-disable-next-line no-await-in-loop
          const currentErrors = await checkFunction(
            items,
            refTable.name,
            table.name
          );
          errors.push(...currentErrors);
        }
      } else {
        errors.push(`Check function for Check Table "${table.name}" not found`);
      }
    }
    return errors;
  }

  checkParams() {
    const tables = this.tables.filter((table) => table instanceof RulesTable);
    const errors = [];
    for (let i = 0; i < tables.length; i += 1) {
      const table = tables[i];
      for (let j = 0; j < table.params.length; j += 1) {
        const param = table.params[j];
        if (!param.position) {
          errors.push(
            `Table ${table.name} has argument ${param.name} without a header`
          );
        }
      }
    }
    return errors;
  }

  async test(checkFunctions = {}) {
    const testTables = this.tables.filter(
      (table) => table instanceof TestTable
    );
    const errors = this.checkReturns();
    const paramErrors = this.checkParams();
    errors.push(...paramErrors);
    for (let i = 0; i < testTables.length; i += 1) {
      const testTable = testTables[i];
      const currentErrors = testTable.run();
      errors.push(...currentErrors);
    }
    const checkErrors = await this.executeCheckTables(checkFunctions);
    errors.push(...checkErrors);
    return errors;
  }
}

module.exports = XBook;
