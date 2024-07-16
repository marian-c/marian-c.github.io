import { type Config, type FinalConfig, makeConfig } from '@/mcw6502compiler/config';
import {
  type AddressingModeNode,
  DirectiveKind,
  type DirectiveNode,
  InstructionKind,
  type InstructionNode,
  type InstructionWithOperandNode,
  type LabelDefinitionNode,
  NodeKind,
  type ReferenceNode,
  type SymbolDefinitionNode,
  ValueLiteralKind,
  type ValueLiteralNode,
} from '@/mcw6502compiler/parser/ast';
import { sureAccess } from '@/helpers/objects';
import { assertNever } from '@/utils';
import { ErrorShouldNotHappen } from '@/errors/ErrorShouldNotHappen';
import { type GenericResult, GenericResultKind } from '@/types';
import {
  type ErrorResult,
  makeError,
  type ParseResult,
} from '@/mcw6502compiler/parser/parserTypes';

// TODO: defined symbols should be case insensitive
// TODO: validate the values of valuable, for example a given value must make sense for where it's used (zeropage for example)

// TODO: check for invalid references (no use before define, except for labels, all need to exist)

// TODO: check for references to far away

class AssemblerError extends Error {
  constructor(public errorResult: ErrorResult) {
    super(
      `AssembleError encountered ${errorResult.message}, ${errorResult.range}, ${errorResult.lineRange}`,
    );
  }
}

type InternalState = {
  hexList: number[];
  definitions: Map<string, number[]>;
  references: Map<
    number,
    { name: string; len: number; mode: 'as-is' } | { name: string; mode: 'relative' }
  >;
  parseTree: ParseResult;
  startIdx: number | undefined;
};

function numberToBytes(value: number): number[] {
  const result: number[] = [];
  while (true) {
    const r = value & 0x00ff;
    result.push(r);
    value = value >> 8;
    if (value === 0) {
      break;
    }
  }
  return result;
}

function bytesToNumber(bytes: number[]): number {
  return bytes.reduce((acc, curr, idx) => {
    return (curr << (idx * 8)) | acc;
  }, 0);
}

function handleLabelDefinitionNode(
  labelDefinitionNode: LabelDefinitionNode,
  _config: FinalConfig,
  state: InternalState,
) {
  switch (labelDefinitionNode.kind) {
    case NodeKind.labelDefinition:
      const value = state.hexList.length + (state.startIdx || 0);
      const bytes = numberToBytes(value);
      if (bytes.length > 2) {
        throw new ErrorShouldNotHappen(`Calculated label definition location too big ${value}`);
      }
      const toFill = 2 - bytes.length;
      if (toFill !== 0) {
        bytes.push(...new Array(toFill).fill(0));
      }
      state.definitions.set(labelDefinitionNode.value, bytes);
      break;
    default:
      assertNever(labelDefinitionNode.kind);
  }
}

function valueLiteralToNumber(valueLiteral: ValueLiteralNode): number {
  let value: number;
  switch (valueLiteral.valueLiteralKind) {
    case ValueLiteralKind.ascii:
      value = valueLiteral.originalStringValue
        .split('')
        .reverse()
        .reduce((acc, curr, idx) => {
          const v = curr.charCodeAt(0);
          const r = (v << idx) + acc;
          return r;
        }, 0);
      break;
    case ValueLiteralKind.hex:
      value = parseInt(valueLiteral.originalStringValue, 16);
      break;
    case ValueLiteralKind.dec:
      value = parseInt(valueLiteral.originalStringValue, 10);
      break;
    case ValueLiteralKind.bin:
      value = parseInt(valueLiteral.originalStringValue, 2);
      break;
    default:
      assertNever(valueLiteral.valueLiteralKind);
  }

  return value;
}

function valueLiteralToBytes(valueLiteral: ValueLiteralNode): number[] {
  let value: number;
  switch (valueLiteral.valueLiteralKind) {
    case ValueLiteralKind.ascii:
      return valueLiteral.originalStringValue
        .split('')
        .reverse()
        .map((c) => c.charCodeAt(0));
    case ValueLiteralKind.hex:
      value = parseInt(valueLiteral.originalStringValue, 16);
      break;
    case ValueLiteralKind.dec:
      value = parseInt(valueLiteral.originalStringValue, 10);
      break;
    case ValueLiteralKind.bin:
      value = parseInt(valueLiteral.originalStringValue, 2);
      break;
    default:
      assertNever(valueLiteral.valueLiteralKind);
  }

  const result: number[] = [];
  while (true) {
    const r = value & 0x00ff;
    result.push(r);
    value = value >> 8;
    if (value === 0) {
      break;
    }
  }
  return result;
}

function insertValueLiteral(
  limit: 1 | 2,
  valueLiteralNode: ValueLiteralNode,
  _config: FinalConfig,
  state: InternalState,
): void {
  const bytes = valueLiteralToBytes(valueLiteralNode);
  if (bytes.length > limit) {
    throw new AssemblerError(
      makeError(
        `Value literal does not fit in ${limit} byte(s)`,
        valueLiteralNode.range,
        state.parseTree.originalLines,
      ),
    );
  }
  if (limit === 2 && bytes.length === 1) {
    bytes.push(0);
  }
  state.hexList.push(...bytes);
}

function insertBytes(
  limit: number,
  bytes_: number[],
  location: number,
  _config: FinalConfig,
  state: InternalState,
): void {
  const bytes = [...bytes_];
  if (bytes.length > limit) {
    throw new AssemblerError(
      makeError(
        `number of bytes to insert (${bytes.length}) is too big, limit: ${limit}`,
        state.parseTree.program.range,
        state.parseTree.originalLines,
      ),
    );
  }

  const toFill = limit - bytes.length;
  if (toFill !== 0) {
    bytes.push(...new Array(toFill).fill(0));
  }
  state.hexList.splice(location, limit, ...bytes);
}

function handleInstructionWithOperandValueLiteral(
  operandKind: AddressingModeNode['kind'],
  valueLiteralNode: ValueLiteralNode,
  config: FinalConfig,
  state: InternalState,
): void {
  switch (operandKind) {
    case NodeKind.relAddressingMode:
      const nextIdx = state.hexList.length;
      const v = valueLiteralToNumber(valueLiteralNode);
      const r = v - nextIdx - 1;
      // TODO: validate R;
      state.hexList.push(r);
      break;
    case NodeKind.immAddressingMode:
    case NodeKind.zp0AddressingMode:
    case NodeKind.zpxAddressingMode:
    case NodeKind.izxAddressingMode:
    case NodeKind.izyAddressingMode:
    case NodeKind.zpyAddressingMode:
      insertValueLiteral(1, valueLiteralNode, config, state);
      break;
    case NodeKind.absAddressingMode:
    case NodeKind.abxAddressingMode:
    case NodeKind.abyAddressingMode:
    case NodeKind.indAddressingMode:
      insertValueLiteral(2, valueLiteralNode, config, state);
      break;

    default:
      assertNever(operandKind);
  }
}
function handleInstructionWithOperandValueReference(
  operandKind: AddressingModeNode['kind'],
  referenceNode: ReferenceNode,
  _config: FinalConfig,
  state: InternalState,
): void {
  switch (operandKind) {
    case NodeKind.relAddressingMode:
      // push a placeholder
      state.hexList.push(0);
      state.references.set(state.hexList.length - 1, {
        mode: 'relative',
        name: referenceNode.referencedName,
      });
      break;
    case NodeKind.immAddressingMode:
    case NodeKind.zp0AddressingMode:
    case NodeKind.zpxAddressingMode:
    case NodeKind.izxAddressingMode:
    case NodeKind.izyAddressingMode:
    case NodeKind.zpyAddressingMode:
      // push a placeholder
      state.hexList.push(0);
      state.references.set(state.hexList.length - 1, {
        len: 1,
        mode: 'as-is',
        name: referenceNode.referencedName,
      });
      break;
    case NodeKind.absAddressingMode:
    case NodeKind.abxAddressingMode:
    case NodeKind.abyAddressingMode:
    case NodeKind.indAddressingMode:
      // push 2 placeholders
      state.hexList.push(0, 0);
      state.references.set(state.hexList.length - 2, {
        len: 2,
        mode: 'as-is',
        name: referenceNode.referencedName,
      });
      break;

    default:
      assertNever(operandKind);
  }
}

function handleInstructionWithOperand(
  instructionWithOperandNode: InstructionWithOperandNode,
  config: FinalConfig,
  state: InternalState,
): void {
  const operatorConf = sureAccess(
    config.instructionsInfo,
    instructionWithOperandNode.operator.value,
  );

  const operand = instructionWithOperandNode.operand;
  const operandKind = operand.kind;

  switch (operandKind) {
    case NodeKind.absAddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'abs'));
      break;
    case NodeKind.immAddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'imm'));
      break;
    case NodeKind.zp0AddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'zp0'));
      break;
    case NodeKind.abxAddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'abx'));
      break;
    case NodeKind.abyAddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'aby'));
      break;
    case NodeKind.zpxAddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'zpx'));
      break;
    case NodeKind.indAddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'ind'));
      break;
    case NodeKind.izxAddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'izx'));
      break;
    case NodeKind.izyAddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'izy'));
      break;
    case NodeKind.relAddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'rel'));
      break;
    case NodeKind.zpyAddressingMode:
      state.hexList.push(sureAccess(operatorConf.opCodes, 'zpy'));
      break;
    default:
      assertNever(operandKind);
  }

  const valuable = operand.value;
  const valuableKind = valuable.kind;

  switch (valuableKind) {
    case NodeKind.valueLiteral:
      handleInstructionWithOperandValueLiteral(operandKind, valuable, config, state);
      break;
    case NodeKind.reference:
      handleInstructionWithOperandValueReference(operandKind, valuable, config, state);
      break;
    default:
      assertNever(valuableKind);
  }
}

function handleInstructionNode(
  instructionNode: InstructionNode,
  config: FinalConfig,
  state: InternalState,
): void {
  const instructionKind = instructionNode.instructionKind;
  switch (instructionKind) {
    case InstructionKind.withoutOperand:
      const operatorConf = sureAccess(config.instructionsInfo, instructionNode.operator.value);
      const operandConf = sureAccess(operatorConf.opCodes, 'imp');
      state.hexList.push(operandConf);
      break;
    case InstructionKind.withOperand:
      handleInstructionWithOperand(instructionNode, config, state);
      break;
    default:
      assertNever(instructionKind);
  }
}

function handleDirectiveNode(
  directiveNode: DirectiveNode,
  config: FinalConfig,
  state: InternalState,
) {
  const lineDirectiveKind = directiveNode.directiveKind;
  switch (lineDirectiveKind) {
    case DirectiveKind.org:
      const address = directiveNode.address;
      // TODO: future: could allow .org directives to reference
      //   symbols if they are resolved by now
      const orgValue = valueLiteralToNumber(address);

      if (state.hexList.length === 0 && state.startIdx === undefined) {
        state.startIdx = orgValue;
      } else {
        const fillLength = orgValue - (state.startIdx || 0) - state.hexList.length;
        if (fillLength < 0) {
          throw new AssemblerError(
            makeError(
              `.org directive referenced an address behind the current PC (diff: ${fillLength})`,
              directiveNode.range,
              state.parseTree.originalLines,
            ),
          );
        }
        state.hexList.push(...new Array(fillLength).fill(0));
      }
      break;
    case DirectiveKind.word:
      const valuable = directiveNode.value;
      switch (valuable.kind) {
        case NodeKind.valueLiteral:
          insertValueLiteral(2, valuable, config, state);
          break;
        case NodeKind.reference:
          // push a placeholder
          state.hexList.push(0, 0);
          state.references.set(state.hexList.length - 2, {
            len: 2,
            mode: 'as-is',
            name: valuable.referencedName,
          });
          break;
        default:
          assertNever(valuable);
      }
      break;
    default:
      assertNever(lineDirectiveKind);
  }
}

function handleSymbolDefinitionNode(
  symbolDefinitionNode: SymbolDefinitionNode,
  _config: FinalConfig,
  state: InternalState,
) {
  const kind = symbolDefinitionNode.kind;
  switch (kind) {
    case NodeKind.symbolDefinition:
      const v = valueLiteralToBytes(symbolDefinitionNode.symbolValue);
      state.definitions.set(symbolDefinitionNode.symbolName, v);
      break;
    default:
      assertNever(kind);
  }
}

function _assemble(
  parseTree: ParseResult,
  initialConfig: Config,
): GenericResult<ErrorResult, { data: Uint8Array; startAddress: number }> {
  const config = makeConfig(initialConfig);

  const state: InternalState = {
    hexList: [],
    definitions: new Map<string, number[]>(),
    references: new Map<
      number,
      { name: string; len: number; mode: 'as-is' } | { name: string; mode: 'relative' }
    >(),
    parseTree,
    startIdx: undefined,
  };

  const program = parseTree.program;

  for (const line of program.lines) {
    if (!line.contents) {
      continue;
    }
    const contentsKind = line.contents.kind;

    switch (contentsKind) {
      case NodeKind.labelDefinition:
        handleLabelDefinitionNode(line.contents, config, state);
        break;
      case NodeKind.instruction:
        handleInstructionNode(line.contents, config, state);
        break;
      case NodeKind.directive:
        handleDirectiveNode(line.contents, config, state);
        break;
      case NodeKind.symbolDefinition:
        handleSymbolDefinitionNode(line.contents, config, state);
        break;
      default:
        assertNever(contentsKind);
    }
  }

  // resolve references
  state.references.forEach((reference, location) => {
    const def = state.definitions.get(reference.name);
    if (def === undefined) {
      // this should not happen as the validation step would cover this situation
      throw new ErrorShouldNotHappen(`Referenced label not defined (${reference.name})`);
    }
    switch (reference.mode) {
      case 'as-is':
        insertBytes(reference.len, def, location, config, state);
        break;
      case 'relative':
        if (def.length > 2) {
          throw new AssemblerError(
            makeError(
              `Relative mode reference (${reference.name}) points to something bigger than 2 bytes ${def}`,
              state.parseTree.program.range,
              state.parseTree.originalLines,
            ),
          );
        }
        // TODO: validate delta
        const v = bytesToNumber(def);
        const delta = v - location - 1;
        state.hexList[location] = delta;
        break;
      default:
        assertNever(reference);
    }
  });

  return {
    kind: GenericResultKind.success,
    result: { data: new Uint8Array(state.hexList), startAddress: state.startIdx || 0 },
  };
}

/**
 * Takes a program, returns hex list
 * program should be complete and validated
 */
export function assemble(
  parseTree: ParseResult,
  initialConfig: Config,
): GenericResult<ErrorResult, { data: Uint8Array; startAddress: number }> {
  try {
    return _assemble(parseTree, initialConfig);
  } catch (e) {
    const isAssemblerError = e instanceof AssemblerError;
    let unexpectedMessage = '[missing]';
    if (e instanceof Error) {
      unexpectedMessage = e.message;
    }
    if (!isAssemblerError) {
      console.error(e);
    }
    return {
      kind: GenericResultKind.error,
      errors: [
        isAssemblerError
          ? e.errorResult
          : makeError(
              `Unexpected assembler error: ${unexpectedMessage}`,
              parseTree.program.range,
              parseTree.originalLines,
            ),
      ],
    };
  }
}
