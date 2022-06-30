const { toValue } = require('../book-utils');

class ConstantsTable {
  constructor(parent, table) {
    this.parent = parent;
    if (table) {
      this.build(table);
    }
  }

  build(table) {
    this.params = [];
    this.paramsByName = {};
    for (let i = 1; i < table.length; i += 1) {
      const row = table[i];
      const type = row[0].trim();
      const param = {
        type,
        name: row[1].trim(),
        value: row[2] === null ? undefined : toValue(type, row[2]),
      };
      this.params.push(param);
      this.paramsByName[param.name] = param;
    }
  }

  toJSON() {
    return {
      className: this.constructor.name,
      params: this.params,
    };
  }

  fromJSON(data) {
    this.params = data.params;
    this.paramsByName = {};
    for (let i = 0; i < this.params.length; i += 1) {
      this.paramsByName[this.params[i].name] = this.params[i];
    }
  }
}

module.exports = ConstantsTable;
