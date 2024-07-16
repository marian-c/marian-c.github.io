type Int1 = number & { __brandFitsIn1Bits: true };
type Int2 = number & { __brandFitsIn2Bits: true };
type Int3 = number & { __brandFitsIn3Bits: true };
type Int8 = number & { __brandFitsIn8Bits: true };
type Int16 = number & { __brandFitsIn16Bits: true };
type Unsigned = number & { __brandSign: 'unsigned' };

export type UInt1 = Unsigned & Int1;
export type UInt2 = Unsigned & Int2;
export type UInt3 = Unsigned & Int3;
export type UInt8 = Unsigned & Int8;
export type UInt16 = Unsigned & Int16;

export function expand(small: UInt8): UInt16 {
  return small as number as UInt16;
}

export type ListOfData = UInt8[];

export function createListOfData(len: number): ListOfData {
  return new Array(len).fill(0);
}

export function hex(n: number, paddingLength: number) {
  return '0x' + n.toString(16).padStart(paddingLength, '0');
}

export function bin(n: number, paddingLength: number = 8) {
  return '0b' + n.toString(2).padStart(paddingLength, '0');
}

/**
 * useful for positive numbers
 */
export function div(a: number, b: number) {
  return Math.floor(a / b);
}

export function toSignedInt8(n: UInt8): Int8 {
  // https://stackoverflow.com/q/15389608
  // https://blog.vjeux.com/2013/javascript/conversion-from-uint8-to-int8-x-24.html
  // https://stackoverflow.com/q/14890994
  return ((n << 24) >> 24) as Int8;
}
