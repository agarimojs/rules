const { evaluate } = require('@agarimo/evaluator');

class RulesTable {
  constructor(parent, table, isMulti = false) {
    this.parent = parent;
    this.isMulti = isMulti;
    if (table) {
      this.build(table);
    }
  }

  buildParams(paramsStr) {
    this.params = [];
    this.paramsByName = {};
    const params = paramsStr.split(',').map((param) => param.trim());
    for (let i = 0; i < params.length; i += 1) {
      const tokens = params[i].split(' ');
      const name = tokens.length > 1 ? tokens[1] : tokens[0];
      const type = tokens.length > 1 ? tokens[0] : 'any';
      const param = {
        name,
        type,
      };
      this.params.push(param);
      this.paramsByName[name] = param;
    }
  }

  static toPosition(str) {
    if (str.startsWith('C')) {
      return {
        type: 'column',
        index: parseInt(str.substring(1), 10),
      };
    }
    return {
      type: 'row',
      index: parseInt(str.substring(2), 10),
    };
  }

  static compileCondition(param, header) {
    if (header === null) {
      return {
        type: 'true',
      };
    }
    if (param.positionType === 'String') {
      return {
        type: 'equal',
        value: header,
      };
    }
    if (param.positionType === 'Integer' || param.positionType === 'Float') {
      return {
        type: 'equal',
        value: parseFloat(header),
      };
    }
    if (
      param.positionType === 'IntRange' ||
      param.positionType === 'FloatRange'
    ) {
      if (header.startsWith('<=')) {
        return {
          type: 'lessEqual',
          value: parseFloat(header.slice(2)),
        };
      }
      if (header.startsWith('>=')) {
        return {
          type: 'greaterEqual',
          value: parseFloat(header.slice(2)),
        };
      }
      if (header.startsWith('<')) {
        return {
          type: 'lessThan',
          value: parseFloat(header.slice(1)),
        };
      }
      if (header.startsWith('>')) {
        return {
          type: 'greaterThan',
          value: parseFloat(header.slice(1)),
        };
      }
      if (header.startsWith('[') || header.startsWith('(')) {
        const result = {
          type: 'range',
        };
        const left = header[0];
        const right = header[header.length - 1];
        const values = header
          .slice(1, header.length - 1)
          .split('..')
          .map((x) => parseFloat(x));
        result.typeLeft = left === '[' ? 'greaterThan' : 'greaterEqual';
        result.typeRight = right === ']' ? 'lessThan' : 'lessEqual';
        result.valueLeft = parseFloat(values[0]);
        result.valueRight = parseFloat(values[1]);
        return result;
      }
      return {
        type: 'equal',
        value: parseFloat(header),
      };
    }
    return {
      type: 'false',
    };
  }

  checkCondition(condition, value) {
    switch (condition.type) {
      case 'true':
        return true;
      case 'equal':
        return value === condition.value;
      case 'lessThan':
        return value < condition.value;
      case 'lessEqual':
        return value <= condition.value;
      case 'greaterThan':
        return value > condition.value;
      case 'greaterEqual':
        return value >= condition.value;
      case 'range':
        return (
          this.checkCondition(
            { type: condition.typeLeft, value: condition.valueLeft },
            value
          ) &&
          this.checkCondition(
            { type: condition.typeRight, value: condition.valueRight },
            value
          )
        );
      default:
        return false;
    }
  }

  build(table) {
    this.columnParams = [];
    this.rowParams = [];
    const title = table[0][0].trim();
    const posParenthesis = title.indexOf('(');
    this.buildParams(title.substring(posParenthesis + 1, title.length - 1));
    const tokens = title.substring(0, posParenthesis).split(' ');
    if (tokens.length === 2) {
      [, this.name] = tokens;
      this.type = 'any';
    } else {
      [, this.type, this.name] = tokens;
    }
    let currentLine = table[1];
    for (let i = 0; i < currentLine.length; i += 1) {
      const position = currentLine[i];
      if (position) {
        const paramName = table[2][i];
        const paramType = table[3][i];
        if (paramName) {
          const param = this.paramsByName[paramName];
          if (!param) {
            throw new Error(
              `Param not found: ${paramName} at Rule ${this.name}`
            );
          }
          param.position = RulesTable.toPosition(position);
          if (param.position.type === 'column') {
            this.columnParams.push(param);
          } else {
            this.rowParams.push(param);
          }
          param.positionType = paramType;
        } else {
          this.resultType = paramType;
        }
      }
    }
    this.columnParams.sort((a, b) => a.position.index - b.position.index);
    this.rowParams.sort((a, b) => a.position.index - b.position.index);
    let currentLineIndex = 4;
    for (let i = 0; i < this.rowParams.length; i += 1) {
      const param = this.rowParams[i];
      param.headers = [];
      currentLine = table[currentLineIndex];
      for (let j = this.columnParams.length; j < currentLine.length; j += 1) {
        param.headers.push(RulesTable.compileCondition(param, currentLine[j]));
      }
      currentLineIndex += 1;
    }
    for (let i = 0; i < this.columnParams.length; i += 1) {
      const param = this.columnParams[i];
      param.headers = [];
      for (let j = currentLineIndex; j < table.length; j += 1) {
        param.headers.push(RulesTable.compileCondition(param, table[j][i]));
      }
    }
    this.matrix = [];
    for (let i = currentLineIndex; i < table.length; i += 1) {
      currentLine = table[i];
      const line = [];
      this.matrix.push(line);
      for (let j = this.columnParams.length; j < currentLine.length; j += 1) {
        line.push(currentLine[j]);
      }
    }
  }

  findRowIndexes(paramValues) {
    if (this.columnParams.length === 0) {
      return 0;
    }
    let matchIndexes = [];
    for (let i = 0; i < this.columnParams[0].headers.length; i += 1) {
      matchIndexes.push(i);
    }
    for (let i = 0; i < this.columnParams.length; i += 1) {
      const param = this.columnParams[i];
      const value = paramValues[param.name];
      const currentMatchIndexes = [];
      for (let j = 0; j < matchIndexes.length; j += 1) {
        const index = matchIndexes[j];
        if (this.checkCondition(param.headers[index], value)) {
          currentMatchIndexes.push(index);
        }
      }
      matchIndexes = matchIndexes.filter((x) =>
        currentMatchIndexes.includes(x)
      );
    }
    return matchIndexes;
  }

  findColumnIndexes(paramValues) {
    if (this.rowParams.length === 0) {
      return 0;
    }
    let matchIndexes = [];
    for (let i = 0; i < this.rowParams[0].headers.length; i += 1) {
      matchIndexes.push(i);
    }
    for (let i = 0; i < this.rowParams.length; i += 1) {
      const param = this.rowParams[i];
      const value = paramValues[param.name];
      const currentMatchIndexes = [];
      for (let j = 0; j < matchIndexes.length; j += 1) {
        const index = matchIndexes[j];
        if (this.checkCondition(param.headers[index], value)) {
          currentMatchIndexes.push(index);
        }
      }
      matchIndexes = matchIndexes.filter((x) =>
        currentMatchIndexes.includes(x)
      );
    }
    return matchIndexes;
  }

  getValue(rowIndex, columnIndex) {
    const value = this.matrix[rowIndex][columnIndex];
    if (value && typeof value === 'string' && value.trim().startsWith('=')) {
      const context = this.parent.buildContext();
      return evaluate(value.trim().substring(1), context);
    }
    return value;
  }

  executeContext(paramValues) {
    const rowIndexes = this.findRowIndexes(paramValues);
    const columnIndexes = this.findColumnIndexes(paramValues);
    if (this.isMulti) {
      const results = new Set();
      for (let i = 0; i < rowIndexes.length; i += 1) {
        for (let j = 0; j < columnIndexes.length; j += 1) {
          results.add(this.getValue(rowIndexes[i], columnIndexes[j]));
        }
      }
      return [...results];
    }
    const rowIndex = rowIndexes[0];
    const columnIndex = columnIndexes[0];
    if (rowIndex >= 0 && columnIndex >= 0) {
      return this.getValue(rowIndex, columnIndex);
    }
    return undefined;
  }

  executeArray(paramValues) {
    const context = this.parent.buildContext();
    for (let i = 0; i < this.params.length; i += 1) {
      context[this.params[i].name] = paramValues[i];
    }
    return this.executeContext(context);
  }

  execute(...args) {
    return this.executeArray(args);
  }

  getFn() {
    return (...args) => this.execute(...args);
  }

  toJSON() {
    return {
      className: this.constructor.name,
      isMulti: this.isMulti,
      name: this.name,
      type: this.type,
      resultType: this.resultType,
      params: this.params,
      columnParams: this.columnParams,
      rowParams: this.rowParams,
      matrix: this.matrix,
    };
  }

  fromJSON(data) {
    this.isMulti = data.isMulti;
    this.name = data.name;
    this.type = data.type;
    this.resultType = data.resultType;
    this.params = data.params;
    this.columnParams = data.columnParams;
    this.rowParams = data.rowParams;
    this.matrix = data.matrix;
    this.paramsByName = {};
    for (let i = 0; i < this.params.length; i += 1) {
      const param = this.params[i];
      this.paramsByName[param.name] = param;
    }
  }
}

module.exports = RulesTable;
