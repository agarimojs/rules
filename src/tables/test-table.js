const {
  toValue,
  isObject,
  arrayEquals,
  sheetResultEquals,
} = require('../book-utils');

class TestTable {
  constructor(parent, table) {
    this.parent = parent;
    if (table) {
      this.build(table);
    }
  }

  build(table) {
    const titleParts = table[0][0].trim().split(' ');
    [, this.refTableName, this.name] = titleParts;
    this.paramNames = table[1].map((cell) => cell.trim());
    this.data = table.slice(2);
  }

  buildInput(refTable, data) {
    const constructorName = refTable.constructor.name;
    if (constructorName === 'RulesTable') {
      const result = new Array(this.paramNames.length - 1);
      for (let i = 0; i < this.paramNames.length - 1; i += 1) {
        if (refTable?.paramsByName[this.paramNames[i]]?.index === undefined) {
          throw new Error(
            `Param ${this.paramNames[i]} not found in ${refTable.name}`
          );
        }
        const { index } = refTable.paramsByName[this.paramNames[i]];
        result[index] = data[i];
      }
      return result;
    }
    if (constructorName === 'MethodTable') {
      throw new Error('Tests for MethodTable not implemented');
    } else if (constructorName === 'SpreadsheetTable') {
      const result = {};
      for (let i = 0; i < this.paramNames.length; i += 1) {
        const name = this.paramNames[i];
        if (!name.startsWith('RET.')) {
          result[name] = data[i];
        }
      }
      return [result];
    }
    return undefined;
  }

  // eslint-disable-next-line class-methods-use-this
  buildOutput(refTable, data) {
    const constructorName = refTable.constructor.name;
    if (constructorName === 'RulesTable') {
      const raw = data.slice(-1)[0];
      let value;
      if (refTable.isMulti) {
        const arr = raw.split(',').map((item) => item.trim());
        value = arr.map((item) => toValue(refTable.returnParam.type, item));
      } else {
        value = toValue(refTable.returnParam.type, raw);
      }
      return {
        raw,
        value,
      };
    }
    if (constructorName === 'SpreadsheetTable') {
      const value = {};
      let raw = ``;
      for (let i = 0; i < this.paramNames.length; i += 1) {
        const name = this.paramNames[i];
        if (name.startsWith('RET.')) {
          value[name.slice(4)] = data[i];
          raw = `${raw}${data[i]}, `;
        }
      }
      return {
        raw,
        value,
      };
    }
    return undefined;
  }

  run() {
    const refTable = this.parent.tablesByName[this.refTableName];
    const errors = [];
    if (!refTable) {
      errors.push(`Table ${this.refTableName} not found at Test ${this.name}`);
      return errors;
    }
    const fn = refTable.getFn();
    for (let i = 0; i < this.data.length; i += 1) {
      const input = this.buildInput(refTable, this.data[i]);
      const expected = this.buildOutput(refTable, this.data[i]);
      const actual = fn(...input);
      if (Array.isArray(actual)) {
        if (!arrayEquals(actual, expected.value)) {
          errors.push(
            `Test ${this.name} failed at row ${i + 1}. Expected ${
              expected.raw
            } but got ${actual.join(', ')}`
          );
        }
      } else if (isObject(actual)) {
        if (!sheetResultEquals(actual, expected.value)) {
          errors.push(
            `Test ${this.name} failed at row ${i + 1}. Expected ${
              expected.raw
            } but got ${JSON.stringify(actual)}`
          );
        }
      } else if (actual !== expected.value) {
        errors.push(
          `Test ${this.name} failed at row ${i + 1}. Expected ${
            expected.raw
          } but got ${actual}`
        );
      }
    }
    return errors;
  }

  toJSON() {
    return {
      className: this.constructor.name,
      refTableName: this.refTableName,
      name: this.name,
      paramNames: this.paramNames,
      data: this.data,
    };
  }

  fromJSON(data) {
    this.refTableName = data.refTableName;
    this.name = data.name;
    this.paramNames = data.paramNames;
    this.data = data.data;
  }
}

module.exports = TestTable;
