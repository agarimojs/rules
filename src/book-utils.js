const ALPHACHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const alphaIndex = (c) => ALPHACHARS.indexOf(c);

const isAlphaChar = (c) => alphaIndex(c) !== -1;

function alpha2number(alpha) {
  let result = 0;
  for (let i = 0, l = alpha.length; i < l; i += 1) {
    if (i > 0) {
      result += 1;
    }
    const current = alphaIndex(alpha[i]);
    if (current === -1) {
      throw new Error('Invalid alpha');
    }
    result = result * ALPHACHARS.length + current;
  }
  return result;
}

function number2alpha(n) {
  if (!Number.isInteger(n)) {
    throw new Error('Invalid number');
  }
  if (n < 0) {
    throw new Error('Number cannot be negative');
  }
  const alphalength = ALPHACHARS.length;
  if (n < alphalength) {
    return ALPHACHARS[n];
  }
  let result = '';
  let x = n;
  while (x >= 0) {
    const currentMod = x % alphalength;
    const currentValue = ALPHACHARS[currentMod];
    result = currentValue + result;
    x = (x - currentMod) / alphalength - 1;
  }
  return result;
}

function excel2coord(str) {
  const l = str.length;
  let index = 0;
  let alpha = '';
  let numeric = '';
  while (index < l && isAlphaChar(str[index])) {
    alpha += str[index];
    index += 1;
  }
  while (index < l) {
    numeric += str[index];
    index += 1;
  }
  return {
    column: alpha2number(alpha),
    row: Number.parseInt(numeric, 10) - 1,
  };
}

function coord2excel(coord) {
  return number2alpha(coord.column) + (coord.row + 1);
}

function excel2range(str) {
  const index = str.indexOf(':');
  if (index === -1) {
    throw new Error('Invalid excel range');
  }
  return {
    topleft: excel2coord(str.substring(0, index)),
    bottomright: excel2coord(str.substring(index + 1, str.length)),
  };
}

function getRect(sheet) {
  let minRow = Infinity;
  let maxRow = -Infinity;
  let minColumn = Infinity;
  let maxColumn = -Infinity;
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > maxRow) {
      maxRow = rowNumber;
    }
    if (rowNumber < minRow) {
      minRow = rowNumber;
    }
    row.eachCell((cell, colNumber) => {
      if (colNumber > maxColumn) {
        maxColumn = colNumber;
      }
      if (colNumber < minColumn) {
        minColumn = colNumber;
      }
    });
  });
  return {
    top: minRow,
    bottom: maxRow,
    left: minColumn,
    right: maxColumn,
  };
}

function getCellText(cell) {
  const { value } = cell;
  if (typeof value === 'string' || value === null) {
    return value;
  }
  let result = '';
  for (let i = 0; i < value.richText.length; i += 1) {
    result += value.richText[i].text;
  }
  return result;
}

function isEmptyRow(block, index) {
  const row = block[index];
  if (!row) {
    return true;
  }
  for (let i = 0; i < row.length; i += 1) {
    if (row[i] !== null) {
      return false;
    }
  }
  return true;
}

function findEmptyRow(block) {
  for (let i = 0; i < block.length; i += 1) {
    if (isEmptyRow(block, i)) {
      return i;
    }
  }
  return -1;
}

function isEmptyColumn(block, index) {
  for (let i = 0; i < block.length; i += 1) {
    if (block[i][index] !== null) {
      return false;
    }
  }
  return true;
}

function findEmptyColumn(block) {
  if (!block || block.length === 0) {
    return -1;
  }
  const l = block[0].length;
  for (let i = 0; i < l; i += 1) {
    if (isEmptyColumn(block, i)) {
      return i;
    }
  }
  return -1;
}

function splitByRow(block, emptyRowIndex, nextEmptyRowIndex) {
  const block1 = [];
  const block2 = [];
  for (let i = 0; i < block.length; i += 1) {
    if (i < emptyRowIndex) {
      block1.push(block[i]);
    } else if (i > nextEmptyRowIndex) {
      block2.push(block[i]);
    }
  }
  return [block1, block2];
}

function splitByColumn(block, emptyColumnIndex, nextEmptyColumnIndex) {
  const block1 = [];
  const block2 = [];
  for (let i = 0; i < block.length; i += 1) {
    const row = block[i];
    const row1 = [];
    const row2 = [];
    block1.push(row1);
    block2.push(row2);
    for (let j = 0; j < row.length; j += 1) {
      if (j < emptyColumnIndex) {
        row1.push(row[j]);
      } else if (j > nextEmptyColumnIndex) {
        row2.push(row[j]);
      }
    }
  }
  if (block2[0].length === 0) {
    return [block1];
  }
  if (block1[0].length === 0) {
    return [block2];
  }
  return [block1, block2];
}

function splitBlock(block) {
  const emptyRowIndex = findEmptyRow(block);
  if (emptyRowIndex > -1) {
    let nextEmptyRowIndex = emptyRowIndex;
    while (
      nextEmptyRowIndex < block.length &&
      isEmptyRow(block, nextEmptyRowIndex + 1)
    ) {
      nextEmptyRowIndex += 1;
    }
    return splitByRow(block, emptyRowIndex, nextEmptyRowIndex);
  }
  const emptyColumnIndex = findEmptyColumn(block);
  if (emptyColumnIndex > -1) {
    let nextEmptyColumnIndex = emptyColumnIndex;
    while (
      nextEmptyColumnIndex < block[0].length &&
      isEmptyColumn(block, nextEmptyColumnIndex + 1)
    ) {
      nextEmptyColumnIndex += 1;
    }
    return splitByColumn(block, emptyColumnIndex, nextEmptyColumnIndex);
  }
  return [block];
}

module.exports = {
  ALPHACHARS,
  isAlphaChar,
  alphaIndex,
  alpha2number,
  number2alpha,
  excel2coord,
  coord2excel,
  excel2range,
  getRect,
  getCellText,
  isEmptyRow,
  findEmptyRow,
  isEmptyColumn,
  findEmptyColumn,
  splitBlock,
};
