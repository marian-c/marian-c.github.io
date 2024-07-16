export const emptyRegExp = /^\s*$/;

// test if the line looks like a symbol definition https://regexr.com/812gv
// the part after the "=" is probably not necessary because, later, when matching
// the value, it will fail anyway
export const symbolDefinitionLightRegExp = /^[a-zA-z][a-zA-Z0-9_]*\s*=\s*[^\s;]/;

// given a line that looks like a symbol defnition, extract the symbol name
export const symbolDefinitionNameRegExp = /([a-zA-Z]\w*)\s*=\s*/;

// TODO: this regexp does not allow a comment straight after the directive name
//  that's not a problem with the directives currently supported because all of them expect at least
//  one argument, but it will be a problem for directives that don't require arguments
export const directiveNameRegExp = /^\.([a-zA-Z]+[a-zA-Z0-9_]+)(?!\S)/;

export const instructionOperatorRegExp = /^\b[a-zA-Z]{3}\b/;

export const referenceRegExp = /^([a-zA-Z]+[a-zA-Z0-9_]*)/;

export const valueLiteralHexRegExp = /^\$([0-9A-Fa-f]+)/;
export const valueLiteralDecRegExp = /^([0-9]+)/;
export const valueLiteralBinRegExp = /^%([0-1]+)/;
export const valueLiteralAsciiRegExp = /^"([ -~]+)"/;
