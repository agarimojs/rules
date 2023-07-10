const { evaluate, walkFunctionExecution } = require('@agarimo/evaluator');

class MethodTable {
  constructor(parent, table) {
    this.parent = parent;
    if (table) {
      this.build(table);
    }
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

  buildFn() {
    const context = this.parent.buildContext();
    try {
      evaluate(this.script, context);
    } catch (e) {
      throw new Error(
        `Method "${this.name}" does not contains a valid javascript`
      );
    }
    this.fn = context[this.name];
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
    this.script = script;
    this.buildFn();
  }

  execute(...args) {
    const context = this.parent.buildContext(this.params, args);
    return walkFunctionExecution(this.fn, context, args);
  }

  getFn() {
    return (...args) => this.execute(...args);
  }

  toJSON() {
    return {
      className: this.constructor.name,
      name: this.name,
      params: this.params,
      script: this.script,
    };
  }

  fromJSON(data) {
    this.name = data.name;
    this.params = data.params;
    this.script = data.script;
    this.buildFn();
  }
}

module.exports = MethodTable;
