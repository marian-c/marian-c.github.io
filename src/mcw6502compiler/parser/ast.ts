// TODO: make these ints (remove the values)
export enum NodeKind {
  program = 'p',
  line = 'l',
  reference = 'r',
  instruction = 'i',
  directive = 'd',
  comment = 'c',
  valueLiteral = 'vl',
  labelDefinition = 'ld',
  symbolDefinition = 'sd',
  instructionOperator = 'or',
  instructionOperand = 'od',
  immAddressingMode = 'imm',
  absAddressingMode = 'abs',
  zp0AddressingMode = 'zp0',
  abxAddressingMode = 'abx',
  abyAddressingMode = 'aby',
  zpxAddressingMode = 'zpx',
  zpyAddressingMode = 'zpy',
  indAddressingMode = 'ind',
  izxAddressingMode = 'izx',
  izyAddressingMode = 'izy',
  relAddressingMode = 'rel',
}

export enum InstructionKind {
  withoutOperand,
  withOperand,
}

// DirectiveKind is also used as value, so don't change individual values
export enum DirectiveKind {
  org = 'org',
  word = 'word',
}

export enum ValueLiteralKind {
  ascii = 'ascii',
  bin = 'bin',
  dec = 'dec',
  hex = 'hex',
}

export interface NodeBase {
  readonly kind: NodeKind;
  readonly range: [number, number];
  readonly source?: string;
}
export interface InstructionOperatorNode extends NodeBase {
  readonly kind: NodeKind.instructionOperator;
  readonly value: string;
  readonly forcedTo?: 'b';
}

export interface ValueLiteralNode extends NodeBase {
  readonly kind: NodeKind.valueLiteral;
  readonly valueLiteralKind: ValueLiteralKind;
  readonly originalStringValue: string;
}
export interface ReferenceNode extends NodeBase {
  readonly kind: NodeKind.reference;
  readonly referencedName: string;
}

export type ValuableNode = ValueLiteralNode | ReferenceNode;

export interface ImmAddressingModeNode extends NodeBase {
  readonly kind: NodeKind.immAddressingMode;
  readonly value: ValuableNode;
}

export interface AbsAddressingModeNode extends NodeBase {
  readonly kind: NodeKind.absAddressingMode;
  readonly value: ValuableNode;
}

export interface Zp0AddressingModeNode extends NodeBase {
  readonly kind: NodeKind.zp0AddressingMode;
  readonly value: ValuableNode;
}

export interface AbxAddressingModeNode extends NodeBase {
  readonly kind: NodeKind.abxAddressingMode;
  readonly value: ValuableNode;
}
export interface AbyAddressingModeNode extends NodeBase {
  readonly kind: NodeKind.abyAddressingMode;
  readonly value: ValuableNode;
}
export interface ZpxAddressingModeNode extends NodeBase {
  readonly kind: NodeKind.zpxAddressingMode;
  readonly value: ValuableNode;
}
export interface ZpyAddressingModeNode extends NodeBase {
  readonly kind: NodeKind.zpyAddressingMode;
  readonly value: ValuableNode;
}
export interface IndAddressingModeNode extends NodeBase {
  readonly kind: NodeKind.indAddressingMode;
  readonly value: ValuableNode;
}
export interface IzxAddressingModeNode extends NodeBase {
  readonly kind: NodeKind.izxAddressingMode;
  readonly value: ValuableNode;
}
export interface IzyAddressingModeNode extends NodeBase {
  readonly kind: NodeKind.izyAddressingMode;
  readonly value: ValuableNode;
}

export interface RelAddressingModeNode extends NodeBase {
  readonly kind: NodeKind.relAddressingMode;
  readonly value: ValuableNode;
}

export type AddressingModeNode =
  | ImmAddressingModeNode
  | AbsAddressingModeNode
  | Zp0AddressingModeNode
  | AbxAddressingModeNode
  | AbyAddressingModeNode
  | ZpxAddressingModeNode
  | ZpyAddressingModeNode
  | IndAddressingModeNode
  | IzxAddressingModeNode
  | IzyAddressingModeNode
  | RelAddressingModeNode;

export type InstructionOperandNode = AddressingModeNode;

export interface CommentNode extends NodeBase {
  readonly kind: NodeKind.comment;
  readonly value: string;
}

export interface InstructionWithoutOperandNode extends NodeBase {
  readonly kind: NodeKind.instruction;
  readonly instructionKind: InstructionKind.withoutOperand;
  readonly operator: InstructionOperatorNode;
}
export interface InstructionWithOperandNode extends NodeBase {
  readonly kind: NodeKind.instruction;
  readonly instructionKind: InstructionKind.withOperand;
  readonly operator: InstructionOperatorNode;
  readonly operand: InstructionOperandNode;
}

export interface LabelDefinitionNode extends NodeBase {
  readonly kind: NodeKind.labelDefinition;
  readonly value: string;
}

export type SymbolDefinitionValueNode = ValueLiteralNode;

export interface SymbolDefinitionNode extends NodeBase {
  readonly kind: NodeKind.symbolDefinition;
  readonly symbolName: string;
  readonly symbolValue: SymbolDefinitionValueNode;
}

export interface DirectiveNodeBase extends NodeBase {
  readonly kind: NodeKind.directive;
  readonly directiveKind: DirectiveKind;
}

export interface DirectiveOrgNode extends DirectiveNodeBase {
  readonly directiveKind: DirectiveKind.org;
  // TODO: future: could allow .org directives to reference
  //   symbols if they are resolved by now
  readonly address: ValueLiteralNode;
  // TODO: (fill) actually implement this
  // readonly fill?: ValuableNode;
}
export interface DirectiveWordNode extends DirectiveNodeBase {
  readonly directiveKind: DirectiveKind.word;
  readonly value: ValuableNode;
}

export type DirectiveNode = DirectiveOrgNode | DirectiveWordNode;

export type InstructionNode = InstructionWithoutOperandNode | InstructionWithOperandNode;

export type LineContentsNode =
  | InstructionNode
  | LabelDefinitionNode
  | SymbolDefinitionNode
  | DirectiveNode;

export interface LineNode extends NodeBase {
  kind: NodeKind.line;
  comment?: CommentNode | undefined;
  contents?: LineContentsNode;
}

export interface ProgramNode extends NodeBase {
  readonly kind: NodeKind.program;
  readonly lines: readonly LineNode[];
}
