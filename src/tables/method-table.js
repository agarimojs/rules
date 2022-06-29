const { evaluate, walkFunctionExecution } = require('@agarimo/evaluator');

class MethodTable {
  constructor(parent, table) {
    this.parent = parent;
    this.build(table);
  }

  buildParams(paramsStr) {
    this.params = [];
    const params = paramsStr.split(',').map((param) => param.trim());
    for (let i = 0; i < params.length; i += 1) {
      const tokens = params[i].split(' ');
      const name = tokens.length > 1 ? tokens[1] : tokens[0];
      this.params.push(name);
    }
  }

  build(table) {
    const title = table[0][0].trim();
    const posParenthesis = title.indexOf('(');
    this.buildParams(title.substring(posParenthesis + 1, title.length - 1));
    const tokens = title
      .substring(0, posParenthesis)
      .split(' ')
      .map((s) => s.trim());
    [, , this.name] = tokens;
    let script = `function ${this.name}(${this.params.join(',')}) {\n`;
    for (let i = 1; i < table.length; i += 1) {
      script += `${table[i][0]}\n`;
    }
    script += `}`;
    const context = {};
    evaluate(script, context);
    this.fn = context[this.name];
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
    return walkFunctionExecution(this.fn, context, args);
  }

  getFn() {
    return (...args) => this.execute(...args);
  }
}

module.exports = MethodTable;
