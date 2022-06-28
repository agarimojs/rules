const { evaluate } = require('@agarimo/evaluator');

class SpreadsheetTable {
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

  buildContext(...args) {
    const context = {};
    const keys = Object.keys(this.parent.tablesByName);
    for (let i = 0; i < keys.length; i += 1) {
      const table = this.parent.tablesByName[keys[i]];
      context[keys[i]] = table.getFn ? table.getFn() : table;
    }
    for (let i = 0; i < this.params.length; i += 1) {
      const param = this.params[i].name;
      context[param] = args[i];
    }
    context.Math = Math;
    context.console = console;
    return context;
  }

  execute(...args) {
    const context = this.buildContext(...args);
    const result = {};
    for (let i = 0; i < this.lines.length; i += 1) {
      evaluate(this.lines[i].script, context);
    }
    for (let i = 0; i < this.lines.length; i += 1) {
      result[this.lines[i].name] = context[`$${this.lines[i].name}`];
    }
    return result;
  }

  getFn() {
    return (input) => this.execute(input);
  }
}

module.exports = SpreadsheetTable;
