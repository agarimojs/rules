const { evaluate } = require('@agarimo/evaluator');

class SpreadsheetTable {
  constructor(parent, table) {
    this.parent = parent;
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

  build(table) {
    this.lines = [];
    const title = table[0][0].trim();
    const posParenthesis = title.indexOf('(');
    this.buildParams(title.substring(posParenthesis + 1, title.length - 1));
    const tokens = title.split(' ');
    [, , this.name] = tokens;
    for (let i = 2; i < table.length; i += 1) {
      const line = table[i];
      const [name] = line;
      this.lines.push({ name, script: `$${name} ${line[1]}` });
    }
  }

  execute(...args) {
    const context = this.parent.buildContext(this.params, args);
    const result = {};
    for (let i = 0; i < this.lines.length; i += 1) {
      try {
        evaluate(this.lines[i].script, context);
      } catch (err) {
        console.log(`Error evaluating ${this.lines[i].script}`);
      }
    }
    for (let i = 0; i < this.lines.length; i += 1) {
      result[this.lines[i].name] = context[`$${this.lines[i].name}`];
    }
    return result;
  }

  getFn() {
    return (input) => this.execute(input);
  }

  toJSON() {
    return {
      className: this.constructor.name,
      name: this.name,
      params: this.params,
      lines: this.lines,
    };
  }

  fromJSON(data) {
    this.name = data.name;
    this.params = data.params;
    this.lines = data.lines;
    this.paramsByName = {};
    for (let i = 0; i < this.params.length; i += 1) {
      this.paramsByName[this.params[i].name] = this.params[i];
    }
  }
}

module.exports = SpreadsheetTable;
