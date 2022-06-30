const XBook = require('./xbook');

class RulesEngine {
  constructor() {
    this.books = {};
  }

  async addBook(id, data) {
    const book = new XBook();
    if (typeof data === 'string' || Buffer.isBuffer(data)) {
      await book.read(data);
    } else {
      book.fromJSON(data);
    }
    this.books[id] = book;
  }

  getBook(id) {
    return this.books[id];
  }
}

module.exports = RulesEngine;
