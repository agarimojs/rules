class RulesTable {
  constructor(parent, table) {
    this.parent = parent;
    this.build(table);
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
        param.headers.push(currentLine[j]);
      }
      currentLineIndex += 1;
    }
    for (let i = 0; i < this.columnParams.length; i += 1) {
      const param = this.columnParams[i];
      param.headers = [];
      for (let j = currentLineIndex; j < table.length; j += 1) {
        param.headers.push(table[j][i]);
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

  static matchRange(header, value) {
    if (header.startsWith('<=')) {
      return value <= parseFloat(header.slice(2));
    }
    if (header.startsWith('>=')) {
      return value >= parseFloat(header.slice(2));
    }
    if (header.startsWith('<')) {
      return value < parseFloat(header.slice(1));
    }
    if (header.startsWith('>')) {
      return value > parseFloat(header.slice(1));
    }
    if (header.startsWith('[') || header.startsWith('(')) {
      const left = header[0];
      const right = header[header.length - 1];
      const values = header
        .slice(1, header.length - 1)
        .split('..')
        .map((x) => parseFloat(x));
      if (left === '(') {
        if (value <= values[0]) {
          return false;
        }
      }
      if (left === '[') {
        if (value < values[0]) {
          return false;
        }
      }
      if (right === ')') {
        if (value >= values[1]) {
          return false;
        }
      }
      if (right === ']') {
        if (value > values[1]) {
          return false;
        }
      }
      return true;
    }
    return value === parseFloat(header);
  }

  static match(param, header, value) {
    if (header === null) {
      return true;
    }
    if (param.positionType === 'String') {
      return header === value;
    }
    if (
      param.positionType === 'IntRange' ||
      param.positionType === 'DoubleRange'
    ) {
      return RulesTable.matchRange(header, value);
    }
    return false;
  }

  findRowIndex(paramValues) {
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
        if (RulesTable.match(param, param.headers[index], value)) {
          currentMatchIndexes.push(index);
        }
      }
      matchIndexes = matchIndexes.filter((x) =>
        currentMatchIndexes.includes(x)
      );
    }
    return matchIndexes[0];
  }

  findColumnIndex(paramValues) {
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
        if (RulesTable.match(param, param.headers[index], value)) {
          currentMatchIndexes.push(index);
        }
      }
      matchIndexes = matchIndexes.filter((x) =>
        currentMatchIndexes.includes(x)
      );
    }
    return matchIndexes[0];
  }

  executeContext(paramValues) {
    const rowIndex = this.findRowIndex(paramValues);
    const columnIndex = this.findColumnIndex(paramValues);
    if (
      rowIndex !== undefined &&
      rowIndex !== -1 &&
      columnIndex !== undefined &&
      columnIndex !== -1
    ) {
      return this.matrix[rowIndex][columnIndex];
    }
    return undefined;
  }

  executeArray(paramValues) {
    const context = {};
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
}

module.exports = RulesTable;
