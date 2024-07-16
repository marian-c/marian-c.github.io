export function hex(paddingLength: number, prefix: string, n: number) {
  return prefix + n.toString(16).padStart(paddingLength, '0');
}

export function hexByte(n: number) {
  return hex(2, '0x', n);
}
export function hexWord(n: number) {
  return hex(4, '0x', n);
}

export function bin(paddingLength: number, prefix: string, n: number) {
  return prefix + n.toString(2).padStart(paddingLength, '0');
}

export function binByte(n: number) {
  return bin(8, '0b', n);
}
export function binWord(n: number) {
  return bin(16, '0b', n);
}
