class DatatypeTable {
  constructor(parent, table) {
    this.parent = parent;
    if (table) {
      this.build(table);
    }
  }

  build(table) {
    this.params = {};
    this.name = table[0][0].trim().slice(9).trim();
    for (let i = 1; i < table.length; i += 1) {
      const name = table[i][1].trim();
      const type = table[i][0].trim();
      const defValue = table[i][2] === null ? undefined : table[i][2].trim();
      this.params[name] = {
        name,
        type,
        defValue,
      };
    }
  }

  toJSON() {
    return {
      className: this.constructor.name,
      name: this.name,
      params: this.params,
    };
  }

  fromJSON(data) {
    this.name = data.name;
    this.params = data.params;
  }
}

module.exports = DatatypeTable;
