// inspired by https://github.com/aesy/easy-bits

function checkUnique(config: [string, unknown][]) {
  const set = new Set();
  for (const [label] of config) {
    set.add(label);
  }

  if (set.size !== config.length) {
    throw new Error('You need to use unique labels for bit fields');
  }
}
export function createBitField<T extends [U, 1 | number][], U extends string>(
  config: T,
  totalValue = 0,
) {
  checkUnique(config);
  const totalStats = new Map<U, [startIdx: number, endIdx: number]>();
  let totalBitsLength = 0;
  for (const [label, length] of config) {
    if (length <= 0) {
      throw new Error(`You can't have negative lengths for it fields, received: ${length}`);
    }
    totalStats.set(label, [totalBitsLength, totalBitsLength + length]);
    totalBitsLength += length;
  }

  if (totalBitsLength > 30) {
    throw new Error(`You can't have more than 30 bits in the bitField, total: ${totalBitsLength}`);
  }

  return {
    set(fieldName: T[0][0], value: number) {
      const stats = totalStats.get(fieldName)!;

      const clamp = 2 ** (stats[1] - stats[0]) - 1;
      if (value > clamp) {
        const origValue = value;
        value = value & clamp;
        console.debug(
          `[WARN] bitField: ${fieldName} new value (${origValue}) is bigger than ${length} bits, clamping to new value(${value})`,
        );
      }

      const mask1 = (2 ** stats[0] - 1) << (totalBitsLength - stats[0]);
      const mask2 = 2 ** (totalBitsLength - stats[1]) - 1;
      const mask = mask1 | mask2;

      const valueMask = value << (totalBitsLength - stats[1]);

      totalValue = (totalValue & mask) | valueMask;
    },
    on(fieldName: T[0][0]) {
      const stats = totalStats.get(fieldName)!;
      const value = 2 ** (stats[1] - stats[0]) - 1;
      this.set(fieldName, value);
    },
    off(fieldName: T[0][0]) {
      this.set(fieldName, 0);
    },
    get(fieldName: T[0][0]) {
      const stats = totalStats.get(fieldName)!;
      let value = totalValue >> (totalBitsLength - stats[1]);
      value = value & (2 ** (stats[1] - stats[0]) - 1);
      return value;
    },
    reset(value: number) {
      const clamp = 2 ** totalBitsLength - 1;
      if (value > clamp) {
        totalValue = value & clamp;
        console.debug(
          `[WARN] bitField: reset value (${value}) is bigger than ${totalBitsLength} bits, clamping (${totalValue})`,
        );
      } else {
        totalValue = value;
      }
    },
    value() {
      return totalValue;
    },
  };
}

// not used, but tests the types
export function types() {
  const fields = createBitField([
    ['field1', 1],
    ['field2', 1],
    ['field3', 2],
  ]);

  console.info(fields.set('field1', 1));
  // @ts-expect-error
  console.info(fields.set('fieldx', 1));
}
