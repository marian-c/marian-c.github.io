// FROM: https://github.com/lukeed/clsx/tree/925494cf31bcd97d3337aacd34e659e80cae7fe2
type ClassValue =
  | ClassArray
  | ClassDictionary
  | string
  | number
  | bigint
  | null
  | boolean
  | undefined;
type ClassDictionary = Record<string, any>;
type ClassArray = ClassValue[];

function toVal(mix: ClassValue) {
  var k,
    y,
    str = '';

  if (typeof mix === 'string' || typeof mix === 'number') {
    str += mix;
  } else if (typeof mix === 'object') {
    if (Array.isArray(mix)) {
      var len = mix.length;
      for (k = 0; k < len; k++) {
        if (mix[k]) {
          if ((y = toVal(mix[k]))) {
            str && (str += ' ');
            str += y;
          }
        }
      }
    } else {
      for (y in mix) {
        if (mix![y]) {
          str && (str += ' ');
          str += y;
        }
      }
    }
  }

  return str;
}

export function clsx(...inputs: ClassValue[]) {
  var i = 0,
    tmp,
    x,
    str = '',
    len = inputs.length;
  for (; i < len; i++) {
    if ((tmp = inputs[i])) {
      if ((x = toVal((tmp as any).__clsx || tmp))) {
        str && (str += ' ');
        str += x;
      }
    }
  }
  // (str as any).__clsx = inputs;
  return str;
}
