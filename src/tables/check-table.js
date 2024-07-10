class CheckTable {
  constructor(parent, table) {
    this.parent = parent;
    if (table) {
      this.build(table);
    }
  }

  build(table) {
    this.name = table[0][0].split(' ')[1].trim();
    this.tableNames = [];
    for (let i = 1; i < table.length; i += 1) {
      const row = table[i];
      this.tableNames.push(row[0].trim());
    }
  }

  toJSON() {
    return {
      className: this.constructor.name,
      tableNames: this.tableNames,
    };
  }

  fromJSON(data) {
    this.tableNames = data.tableNames;
  }
}

module.exports = CheckTable;
