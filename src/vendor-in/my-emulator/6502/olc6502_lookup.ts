import type { AddressingMode, Instruction, Operator } from './olc6502_lookup_types';
import { expand, type UInt16, type UInt8 } from '../_/numbers';
import {
  SF_BREAK_COMMAND,
  SF_CARRY,
  SF_DECIMAL_MODE,
  SF_IRQ_DISABLE,
  SF_NEGATIVE,
  SF_OVERFLOW,
  SF_UNUSED,
  SF_ZERO,
} from './olc6502';

/// ADDRESSING MODES:

// The 6502 has a variety of addressing modes to access data in
// memory, some of which are direct and some are indirect (like
// pointers in C++). Each opcode contains information about which
// addressing mode should be employed to facilitate the
// instruction, in regards to where it reads/writes the data it
// uses. The address mode changes the number of bytes that
// makes up the full instruction, so we implement addressing
// before executing the instruction, to make sure the program
// counter is at the correct location, the instruction is
// primed with the addresses it needs, and the number of clock
// cycles the instruction requires is calculated. These functions
// may adjust the number of cycles required depending upon where
// and how the memory is accessed, so they return the required
// adjustment.

// The 6502 can address between 0x0000 - 0xFFFF. The high byte is often referred
// to as the "page", and the low byte is the offset into that page. This implies
// there are 256 pages, each containing 256 bytes.
//
// Several addressing modes have the potential to require an additional clock
// cycle if they cross a page boundary. This is combined with several instructions
// that enable this additional clock cycle. So each addressing function returns
// a flag saying it has potential, as does each instruction. If both instruction
// and address function return 1, then an additional clock cycle is required.

// Address Mode: Implied
// There is no additional data required for this instruction. The instruction
// does something very simple like like sets a status bit. However, we will
// target the accumulator, for instructions like PHA
export const IMP: AddressingMode = (cpu) => {
  cpu.fetched = cpu.a;
  return 0;
};
IMP.fName = 'IMP';

// Address Mode: Immediate
// The instruction expects the next byte to be used as a value, so we'll prep
// the read address to point to the next byte
export const IMM: AddressingMode = function IMM(cpu) {
  // TODO: what if it goes beyond 16 bit limit?
  cpu.addr_abs = cpu.pc;
  cpu.pc++;
  return 0;
};
IMM.fName = 'IMM';

// Address Mode: Zero Page
// To save program bytes, zero page addressing allows you to absolutely address
// a location in first 0xFF bytes of address range. Clearly this only requires
// one byte instead of the usual two.
export const ZP0: AddressingMode = (cpu) => {
  const data = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;
  cpu.addr_abs = expand(data);
  return 0;
};
ZP0.fName = 'ZP0';

// Address Mode: Zero Page with X Offset
// Fundamentally the same as Zero Page addressing, but the contents of the X Register
// is added to the supplied single byte address. This is useful for iterating through
// ranges within the first page.
export const ZPX: AddressingMode = (cpu) => {
  const data = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;
  // wrapped around
  const actualAddress = ((data + cpu.x) & 0x00ff) as UInt16;
  cpu.addr_abs = actualAddress;
  return 0;
};
ZPX.fName = 'ZPX';

// Address Mode: Zero Page with Y Offset
// Same as above but uses Y Register for offset
export const ZPY: AddressingMode = (cpu) => {
  const data = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;
  // wrapped around
  const actualAddress = ((data + cpu.y) & 0x00ff) as UInt16;
  cpu.addr_abs = actualAddress;
  return 0;
};
ZPY.fName = 'ZPY';

// Address Mode: Relative
// This address mode is exclusive to branch instructions. The address
// must reside within -128 to +127 of the branch instruction, i.e.
// you cant directly branch to any address in the addressable range.
export const REL: AddressingMode = (cpu) => {
  const data = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;

  cpu.addr_rel = expand(data);

  if (data & 0x80) {
    // if this is a negative number, turn on high byte so adding to PC works
    cpu.addr_rel = (data | 0xff00) as UInt16;
  }
  return 0;
};
REL.fName = 'REL';

// Address Mode: Absolute
// A full 16-bit address is loaded and used
export const ABS: AddressingMode = function ABS(cpu) {
  const lo = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;
  const hi = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;

  cpu.addr_abs = ((hi << 8) | lo) as UInt16;
  return 0;
};
ABS.fName = 'ABS';

// Address Mode: Absolute with X Offset
// Fundamentally the same as absolute addressing, but the contents of the X Register
// is added to the supplied two byte address. If the resulting address changes
// the page, an additional clock cycle is required
export const ABX: AddressingMode = (cpu) => {
  const lo = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;
  const hi = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;

  const addr = ((hi << 8) | lo) as UInt16;

  // TODO: what if it goes beyond the 16 bit limit, should test this in an emulator, we should probably wrap around
  const finalAddress = (addr + cpu.x) as UInt16;
  cpu.addr_abs = finalAddress;
  if ((finalAddress & 0xff00) !== hi << 8) {
    return 1;
  } else {
    return 0;
  }
};
ABX.fName = 'ABX';

// Address Mode: Absolute with Y Offset
// Fundamentally the same as absolute addressing, but the contents of the Y Register
// is added to the supplied two byte address. If the resulting address changes
// the page, an additional clock cycle is required
export const ABY: AddressingMode = (cpu) => {
  const lo = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;
  const hi = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;

  const addr = ((hi << 8) | lo) as UInt16;

  // TODO: what if it goes beyond the 16 bit limit, should test this in an emulator, we should probably wrap around
  const finalAddress = (addr + cpu.y) as UInt16;
  cpu.addr_abs = finalAddress;
  if ((finalAddress & 0xff00) !== hi << 8) {
    return 1;
  } else {
    return 0;
  }
};
ABY.fName = 'ABY';

// Note: The next 3 address modes use indirection (aka Pointers!)

// Address Mode: Indirect
// The supplied 16-bit address is read to get the actual 16-bit address. This is
// instruction is unusual in that it has a bug in the hardware! To emulate its
// function accurately, we also need to emulate this bug. If the low byte of the
// supplied address is 0xFF, then to read the high byte of the actual address
// we need to cross a page boundary. This doesnt actually work on the chip as
// designed, instead it wraps back around in the same page, yielding an
// invalid actual address
export const IND: AddressingMode = (cpu) => {
  const ptr_lo = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;
  const ptr_hi = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;

  const ptr = ((ptr_hi << 8) | ptr_lo) as UInt16;

  if (ptr_lo === 0x00ff) {
    // hardware bug // TODO: is this present on other variants?
    cpu.addr_abs = ((cpu.read((ptr & 0xff00) as UInt16) << 8) | cpu.read(ptr)) as UInt16;
  } else {
    // TODO: what if it goes beyond 16 bit limit? (ptr+1)
    cpu.addr_abs = ((cpu.read((ptr + 1) as UInt16) << 8) | cpu.read(ptr)) as UInt16;
  }

  return 0;
};
IND.fName = 'IND';

// Address Mode: Indirect X
// The supplied 8-bit address is offset by X Register to index
// a location in page 0x00. The actual 16-bit address is read
// from this location
export const IZX: AddressingMode = function IZX(cpu) {
  const data = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;

  // wrapped around
  const lo = cpu.read(((data + cpu.x) & 0x00ff) as UInt16);
  const hi = cpu.read(((data + cpu.x + 1) & 0x00ff) as UInt16);

  cpu.addr_abs = ((hi << 8) | lo) as UInt16;

  return 0;
};
IZX.fName = 'IZX';

// Address Mode: Indirect Y
// The supplied 8-bit address indexes a location in page 0x00. From
// here the actual 16-bit address is read, and the contents of
// Y Register is added to it to offset it. If the offset causes a
// change in page then an additional clock cycle is required.
export const IZY: AddressingMode = (cpu) => {
  const data = cpu.read(cpu.pc);
  // TODO: what if it goes beyond 16 bit limit?
  cpu.pc++;

  const lo = cpu.read(expand(data));
  const hi = cpu.read(expand(((data + 1) & 0x00ff) as UInt8));

  const addr = (hi << 8) | lo;

  // TODO: what if it exceeds 16 bits
  const finalAddress = (addr + cpu.y) as UInt16;
  cpu.addr_abs = finalAddress;
  if ((finalAddress & 0xff00) !== hi << 8) {
    return 1;
  } else {
    return 0;
  }
};
IZY.fName = 'IZY';

/// INSTRUCTIONS:

// There are 56 "legitimate" opcodes provided by the 6502 CPU. I
// have not modelled "unofficial" opcodes. As each opcode is
// defined by 1 byte, there are potentially 256 possible codes.
// Codes are not used in a "switch case" style on a processor,
// instead they are repsonisble for switching individual parts of
// CPU circuits on and off. The opcodes listed here are official,
// meaning that the functionality of the chip when provided with
// these codes is as the developers intended it to be. Unofficial
// codes will of course also influence the CPU circuitry in
// interesting ways, and can be exploited to gain additional
// functionality!
//
// These functions return 0 normally, but some are capable of
// requiring more clock cycles when executed under certain
// conditions combined with certain addressing modes. If that is
// the case, they return 1.
//
// I have included detailed explanations of each function in
// the class implementation file. Note they are listed in
// alphabetical order here for ease of finding.

// Note: Ive started with the two most complicated instructions to emulate, which
// ironically is addition and subtraction! Ive tried to include a detailed
// explanation as to why they are so complex, yet so fundamental. Im also NOT
// going to do this through the explanation of 1 and 2's complement.

// Instruction: Add with Carry In
// Function:    A = A + M + C
// Flags Out:   C, V, N, Z
//
// Explanation:
// The purpose of this function is to add a value to the accumulator and a carry bit. If
// the result is > 255 there is an overflow setting the carry bit. Ths allows you to
// chain together ADC instructions to add numbers larger than 8-bits. This in itself is
// simple, however the 6502 supports the concepts of Negativity/Positivity and Signed Overflow.
//
// 10000100 = 128 + 4 = 132 in normal circumstances, we know this as unsigned and it allows
// us to represent numbers between 0 and 255 (given 8 bits). The 6502 can also interpret
// this word as something else if we assume those 8 bits represent the range -128 to +127,
// i.e. it has become signed.
//
// Since 132 > 127, it effectively wraps around, through -128, to -124. This wraparound is
// called overflow, and this is a useful to know as it indicates that the calculation has
// gone outside the permissable range, and therefore no longer makes numeric sense.
//
// Note the implementation of ADD is the same in binary, this is just about how the numbers
// are represented, so the word 10000100 can be both -124 and 132 depending upon the
// context the programming is using it in. We can prove this!
//
//  10000100 =  132  or  -124
// +00010001 = + 17      + 17
//  ========    ===       ===     See, both are valid additions, but our interpretation of
//  10010101 =  149  or  -107     the context changes the value, not the hardware!
//
// In principle under the -128 to 127 range:
// 10000000 = -128, 11111111 = -1, 00000000 = 0, 00000000 = +1, 01111111 = +127
// therefore negative numbers have the most significant set, positive numbers do not
//
// To assist us, the 6502 can set the overflow flag, if the result of the addition has
// wrapped around. V <- ~(A^M) & A^(A+M+C) :D lol, let's work out why!
//
// Let's suppose we have A = 30, M = 10 and C = 0
//          A = 30 = 00011110
//          M = 10 = 00001010+
//     RESULT = 40 = 00101000
//
// Here we have not gone out of range. The resulting significant bit has not changed.
// So let's make a truth table to understand when overflow has occurred. Here I take
// the MSB of each component, where R is RESULT.
//
// A  M  R | V | A^R | A^M |~(A^M) |
// 0  0  0 | 0 |  0  |  0  |   1   |
// 0  0  1 | 1 |  1  |  0  |   1   |
// 0  1  0 | 0 |  0  |  1  |   0   |
// 0  1  1 | 0 |  1  |  1  |   0   |  so V = ~(A^M) & (A^R)
// 1  0  0 | 0 |  1  |  1  |   0   |
// 1  0  1 | 0 |  0  |  1  |   0   |
// 1  1  0 | 1 |  1  |  0  |   1   |
// 1  1  1 | 0 |  0  |  0  |   1   |
//
// We can see how the above equation calculates V, based on A, M and R. V was chosen
// based on the following hypothesis:
//       Positive Number + Positive Number = Negative Result -> Overflow
//       Negative Number + Negative Number = Positive Result -> Overflow
//       Positive Number + Negative Number = Either Result -> Cannot Overflow
//       Positive Number + Positive Number = Positive Result -> OK! No Overflow
//       Negative Number + Negative Number = Negative Result -> OK! NO Overflow

const ADC: Operator = (cpu) => {
  // Grab the data that we are adding to the accumulator
  cpu.fetch();

  // Add is performed in 16-bit domain for emulation to capture any
  // carry bit, which will exist in bit 8 of the 16-bit word
  cpu.temp = (cpu.a + cpu.fetched + Number(cpu.getFlag(SF_CARRY))) as UInt16;

  // The carry flag out exists in the high byte bit 0
  cpu.setFlag(SF_CARRY, cpu.temp > 255);

  // The Zero flag is set if the result is 0
  cpu.setFlag(SF_ZERO, (cpu.temp & 0x00ff) === 0);

  // The signed Overflow flag is set based on all that up there! :D
  cpu.setFlag(SF_OVERFLOW, (~(cpu.a ^ cpu.fetched) & (cpu.a ^ cpu.temp) & 0x0080) > 0);

  // The negative flag is set to the most significant bit of the result
  cpu.setFlag(SF_NEGATIVE, (cpu.temp & 0x80) > 0);

  // Load the result into the accumulator (it's 8-bit dont forget!)
  cpu.a = (cpu.temp & 0x00ff) as UInt8;

  // This instruction has the potential to require an additional clock cycle
  return 1;
};

// Instruction: Subtraction with Borrow In
// Function:    A = A - M - (1 - C)
// Flags Out:   C, V, N, Z
//
// Explanation:
// Given the explanation for ADC above, we can reorganise our data
// to use the same computation for addition, for subtraction by multiplying
// the data by -1, i.e. make it negative
//
// A = A - M - (1 - C)  ->  A = A + -1 * (M - (1 - C))  ->  A = A + (-M + 1 + C)
//
// To make a signed positive number negative, we can invert the bits and add 1
// (OK, I lied, a little bit of 1 and 2s complement :P)
//
//  5 = 00000101
// -5 = 11111010 + 00000001 = 11111011 (or 251 in our 0 to 255 range)
//
// The range is actually unimportant, because if I take the value 15, and add 251
// to it, given we wrap around at 256, the result is 10, so it has effectively
// subtracted 5, which was the original intention. (15 + 251) % 256 = 10
//
// Note that the equation above used (1-C), but this got converted to + 1 + C.
// This means we already have the +1, so all we need to do is invert the bits
// of M, the data(!) therfore we can simply add, exactly the same way we did
// before.
const SBC: Operator = (cpu) => {
  cpu.fetch();

  // Operating in 16-bit domain to capture carry out

  // We can invert the bottom 8 bits with bitwise xor
  const value = cpu.fetched ^ 0x00ff;

  // Notice this is exactly the same as addition from here!
  cpu.temp = (cpu.a + value + Number(cpu.getFlag(SF_CARRY))) as UInt16;
  cpu.setFlag(SF_CARRY, (cpu.temp & 0xff00) > 0);
  cpu.setFlag(SF_ZERO, (cpu.temp & 0x00ff) === 0);
  cpu.setFlag(SF_OVERFLOW, ((cpu.temp ^ cpu.a) & (cpu.temp ^ value) & 0x0080) > 0);
  cpu.setFlag(SF_NEGATIVE, (cpu.temp & 0x0080) > 0);
  cpu.a = (cpu.temp & 0x00ff) as UInt8;
  return 1;
};

// OK! Complicated operations are done! the following are much simpler
// and conventional. The typical order of events is:
// 1) Fetch the data you are working with
// 2) Perform calculation
// 3) Store the result in desired place
// 4) Set Flags of the status register
// 5) Return if instruction has potential to require additional
//    clock cycle

// Instruction: Bitwise Logic AND
// Function:    A = A & M
// Flags Out:   N, Z
const AND: Operator = (cpu) => {
  cpu.fetch();

  cpu.a = (cpu.a & cpu.fetched) as UInt8;
  cpu.setFlag(SF_ZERO, cpu.a === 0);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.a & 0x80));
  return 0;
};

// Instruction: Arithmetic Shift Left
// Function:    A = C <- (A << 1) <- 0
// Flags Out:   N, Z, C
const ASL: Operator = (cpu) => {
  cpu.fetch();
  cpu.temp = (cpu.fetched << 1) as UInt16;
  cpu.setFlag(SF_CARRY, (cpu.temp & 0xff00) > 0);
  cpu.setFlag(SF_ZERO, (cpu.temp & 0x00ff) === 0);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.temp & 0x80));

  if (lookup[cpu.opcode]![2] === IMP) {
    cpu.a = (cpu.temp & 0x00ff) as UInt8;
  } else {
    cpu.write(cpu.addr_abs, (cpu.temp & 0x00ff) as UInt8);
  }
  return 0;
};

// Instruction: Branch if Carry Clear
// Function:    if(C == 0) pc = address
const BCC: Operator = (cpu) => {
  if (!cpu.getFlag(SF_CARRY)) {
    cpu.cycles++;

    // clamping so that adding a negative number works, see REL()
    cpu.addr_abs = ((cpu.pc + cpu.addr_rel) & 0x00ffff) as UInt16;

    if ((cpu.addr_abs & 0xff00) !== (cpu.pc & 0xff00)) {
      cpu.cycles++;
    }

    cpu.pc = cpu.addr_abs;
  }
  return 0;
};

// Instruction: Branch if Carry Set
// Function:    if(C == 1) pc = address
const BCS: Operator = (cpu) => {
  if (cpu.getFlag(SF_CARRY)) {
    cpu.cycles++;

    // clamping so that adding a negative number works, see REL()
    cpu.addr_abs = ((cpu.pc + cpu.addr_rel) & 0x00ffff) as UInt16;

    if ((cpu.addr_abs & 0xff00) !== (cpu.pc & 0xff00)) {
      cpu.cycles++;
    }

    cpu.pc = cpu.addr_abs;
  }
  return 0;
};

// Instruction: Branch if Equal
// Function:    if(Z == 1) pc = address
const BEQ: Operator = (cpu) => {
  if (cpu.getFlag(SF_ZERO)) {
    cpu.cycles++;
    // clamping so that adding a negative number works, see REL()
    cpu.addr_abs = ((cpu.pc + cpu.addr_rel) & 0x00ffff) as UInt16;

    if ((cpu.addr_abs & 0xff00) !== (cpu.pc & 0xff00)) {
      cpu.cycles++;
    }

    cpu.pc = cpu.addr_abs;
  }
  return 0;
};

/**
 * bits 7 and 6 of operand are transfered to bit 7 and 6 of SR (N,V);
 * the zero-flag is set according to the result of the operand AND
 * the accumulator (set, if the result is zero, unset otherwise).
 * This allows a quick check of a few bits at once without affecting
 * any of the registers, other than the status register (SR).
 */
const BIT: Operator = (cpu) => {
  cpu.fetch();
  cpu.temp = (cpu.a & cpu.fetched) as UInt16;
  cpu.setFlag(SF_ZERO, (cpu.temp & 0x00ff) === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.fetched & (1 << 7)));
  cpu.setFlag(SF_OVERFLOW, !!(cpu.fetched & (1 << 6)));
  return 0;
};

// Instruction: Branch if Negative
// Function:    if(N == 1) pc = address
const BMI: Operator = (cpu) => {
  if (cpu.getFlag(SF_NEGATIVE)) {
    cpu.cycles++;
    // clamping so that adding a negative number works, see REL()
    cpu.addr_abs = ((cpu.pc + cpu.addr_rel) & 0x00ffff) as UInt16;

    if ((cpu.addr_abs & 0xff00) !== (cpu.pc & 0xff00)) {
      cpu.cycles++;
    }

    cpu.pc = cpu.addr_abs;
  }
  return 0;
};

// Instruction: Branch if Not Equal
// Function:    if(Z == 0) pc = address
const BNE: Operator = (cpu) => {
  if (!cpu.getFlag(SF_ZERO)) {
    cpu.cycles++;
    // clamping so that adding a negative number works, see REL()
    // TODO: understand this and REL()
    cpu.addr_abs = ((cpu.pc + cpu.addr_rel) & 0x00ffff) as UInt16;

    if ((cpu.addr_abs & 0xff00) !== (cpu.pc & 0xff00)) {
      cpu.cycles++;
    }

    cpu.pc = cpu.addr_abs;
  }
  return 0;
};

// Instruction: Branch if Positive
// Function:    if(N == 0) pc = address
const BPL: Operator = (cpu) => {
  if (!cpu.getFlag(SF_NEGATIVE)) {
    cpu.cycles++;
    // clamping so that adding a negative number works, see REL()
    cpu.addr_abs = ((cpu.pc + cpu.addr_rel) & 0x00ffff) as UInt16;

    if ((cpu.addr_abs & 0xff00) !== (cpu.pc & 0xff00)) {
      cpu.cycles++;
    }

    cpu.pc = cpu.addr_abs;
  }
  return 0;
};

// Instruction: Break
// Function:    Program Sourced Interrupt
/**
 * BRK initiates a software interrupt similar to a hardware
 * interrupt (IRQ). The return address pushed to the stack is
 * PC+2, providing an extra byte of spacing for a break mark
 * (identifying a reason for the break.)
 * The status register will be pushed to the stack with the break
 * flag set to 1. However, when retrieved during RTI or by a PLP
 * instruction, the break flag will be ignored.
 * The interrupt disable flag is not set automatically.
 */
const BRK: Operator = (cpu) => {
  cpu.pc++;

  cpu.write((0x0100 + cpu.stkp) as UInt16, ((cpu.pc >> 8) & 0x00ff) as UInt8);
  cpu.stkp = ((cpu.stkp - 1) & 0xff) as UInt8;
  cpu.write((0x0100 + cpu.stkp) as UInt16, (cpu.pc & 0x00ff) as UInt8);
  cpu.stkp = ((cpu.stkp - 1) & 0xff) as UInt8;
  cpu.setFlag(SF_BREAK_COMMAND, true);

  cpu.write((0x0100 + cpu.stkp) as UInt16, cpu.status);
  cpu.stkp = ((cpu.stkp - 1) & 0xff) as UInt8;
  cpu.setFlag(SF_BREAK_COMMAND, false);
  cpu.pc = (cpu.read(0xfffe as UInt16) | (cpu.read(0xffff as UInt16) << 8)) as UInt16;

  cpu.setFlag(SF_IRQ_DISABLE, true);

  return 0;
};

// Instruction: Branch if Overflow Clear
// Function:    if(V == 0) pc = address
const BVC: Operator = (cpu) => {
  if (!cpu.getFlag(SF_OVERFLOW)) {
    cpu.cycles++;
    // clamping so that adding a negative number works, see REL()
    cpu.addr_abs = ((cpu.pc + cpu.addr_rel) & 0x00ffff) as UInt16;

    if ((cpu.addr_abs & 0xff00) !== (cpu.pc & 0xff00)) {
      cpu.cycles++;
    }

    cpu.pc = cpu.addr_abs;
  }
  return 0;
};

// Instruction: Branch if Overflow Set
// Function:    if(V == 1) pc = address
const BVS: Operator = (cpu) => {
  if (cpu.getFlag(SF_OVERFLOW)) {
    cpu.cycles++;
    // clamping so that adding a negative number works, see REL()
    cpu.addr_abs = ((cpu.pc + cpu.addr_rel) & 0x00ffff) as UInt16;

    if ((cpu.addr_abs & 0xff00) !== (cpu.pc & 0xff00)) {
      cpu.cycles++;
    }

    cpu.pc = cpu.addr_abs;
  }
  return 0;
};

// Instruction: Clear Carry Flag
// Function:    C = 0
const CLC: Operator = (cpu) => {
  cpu.setFlag(SF_CARRY, false);
  return 0;
};

// Instruction: Clear Decimal Flag
// Function:    D = 0
const CLD: Operator = (cpu) => {
  cpu.setFlag(SF_DECIMAL_MODE, false);
  return 0;
};

// Instruction: Disable Interrupts / Clear Interrupt Flag
// Function:    I = 0
const CLI: Operator = (cpu) => {
  cpu.setFlag(SF_IRQ_DISABLE, false);
  return 0;
};

// Instruction: Clear Overflow Flag
// Function:    V = 0
const CLV: Operator = (cpu) => {
  cpu.setFlag(SF_OVERFLOW, false);
  return 0;
};

// Instruction: Compare Accumulator
// Function:    C <- A >= M      Z <- (A - M) == 0
// Flags Out:   N, C, Z
const CMP: Operator = (cpu) => {
  cpu.fetch();
  const temp = cpu.a - cpu.fetched;
  cpu.setFlag(SF_CARRY, cpu.a >= cpu.fetched);
  cpu.setFlag(SF_ZERO, (temp & 0x00ff) === 0x0000);
  // TODO: is this correct?
  cpu.setFlag(SF_NEGATIVE, !!(temp & 0x0080));
  return 1;
};

// Instruction: Compare X Register
// Function:    C <- X >= M      Z <- (X - M) == 0
// Flags Out:   N, C, Z
const CPX: Operator = (cpu) => {
  cpu.fetch();
  const temp = cpu.x - cpu.fetched;
  cpu.setFlag(SF_CARRY, cpu.x >= cpu.fetched);
  cpu.setFlag(SF_ZERO, (temp & 0x00ff) === 0x0000);
  // TODO: is this correct?
  cpu.setFlag(SF_NEGATIVE, !!(temp & 0x0080));
  return 0;
};

// Instruction: Compare Y Register
// Function:    C <- Y >= M      Z <- (Y - M) == 0
// Flags Out:   N, C, Z
const CPY: Operator = (cpu) => {
  cpu.fetch();
  const temp = cpu.y - cpu.fetched;
  cpu.setFlag(SF_CARRY, cpu.y >= cpu.fetched);
  cpu.setFlag(SF_ZERO, (temp & 0x00ff) === 0x0000);
  // TODO: is this correct?
  cpu.setFlag(SF_NEGATIVE, !!(temp & 0x0080));
  return 0;
};

// Instruction: Decrement Value at Memory Location
// Function:    M = M - 1
// Flags Out:   N, Z
const DEC: Operator = (cpu) => {
  cpu.fetch();
  const temp = cpu.fetched - 1;
  // // TODO: is this correct?
  cpu.write(cpu.addr_abs, (temp & 0x00ff) as UInt8);
  cpu.setFlag(SF_ZERO, (temp & 0x00ff) === 0x0000);
  // // TODO: is this correct?
  cpu.setFlag(SF_NEGATIVE, !!(temp & 0x0080));
  return 0;
};

// Instruction: Decrement X Register
// Function:    X = X - 1
// Flags Out:   N, Z
const DEX: Operator = (cpu) => {
  cpu.x = ((cpu.x - 1) & 0xff) as UInt8;
  cpu.setFlag(SF_ZERO, cpu.x === 0x00);
  // TODO: is this correct?
  cpu.setFlag(SF_NEGATIVE, !!(cpu.x & 0x80));
  return 0;
}; // Instruction: Decrement Y Register
// Function:    Y = Y - 1
// Flags Out:   N, Z
const DEY: Operator = (cpu) => {
  cpu.y = ((cpu.y - 1) & 0xff) as UInt8;
  cpu.setFlag(SF_ZERO, cpu.y === 0x00);
  // TODO: is this correct?
  cpu.setFlag(SF_NEGATIVE, !!(cpu.y & 0x80));
  return 0;
};

// Instruction: Bitwise Logic XOR
// Function:    A = A xor M
// Flags Out:   N, Z
const EOR: Operator = (cpu) => {
  cpu.fetch();
  cpu.a = (cpu.a ^ cpu.fetched) as UInt8;
  cpu.setFlag(SF_ZERO, cpu.a === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.a & 0x80));
  return 1;
};

// Instruction: Increment Value at Memory Location
// Function:    M = M + 1
// Flags Out:   N, Z
const INC: Operator = (cpu) => {
  cpu.fetch();
  const temp = cpu.fetched + 1;
  cpu.write(cpu.addr_abs, (temp & 0x00ff) as UInt8);
  cpu.setFlag(SF_ZERO, (temp & 0x00ff) === 0x0000);
  cpu.setFlag(SF_NEGATIVE, !!(temp & 0x0080));
  return 0;
};

// Instruction: Increment X Register
// Function:    X = X + 1
// Flags Out:   N, Z
const INX: Operator = (cpu) => {
  cpu.x = ((cpu.x + 1) & 0x00ff) as UInt8;
  cpu.setFlag(SF_ZERO, cpu.x === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.x & 0x80));
  return 0;
};

// Instruction: Increment Y Register
// Function:    Y = Y + 1
// Flags Out:   N, Z
const INY: Operator = (cpu) => {
  cpu.y = ((cpu.y + 1) & 0x00ff) as UInt8;
  cpu.setFlag(SF_ZERO, cpu.y === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.y & 0x80));
  return 0;
};

// Instruction: Jump To Location
// Function:    pc = address
const JMP: Operator = (cpu) => {
  cpu.pc = cpu.addr_abs;
  return 0;
};

// Instruction: Jump To Sub-Routine
// Function:    Push current pc to stack, pc = address
const JSR: Operator = (cpu) => {
  // TODO: how do other emulators deal with PC being 0 then decremented
  cpu.pc--;

  cpu.write((0x0100 + cpu.stkp) as UInt16, ((cpu.pc >> 8) & 0x00ff) as UInt8);
  cpu.stkp = ((cpu.stkp - 1) & 0xff) as UInt8;
  cpu.write((0x0100 + cpu.stkp) as UInt16, (cpu.pc & 0x00ff) as UInt8);
  cpu.stkp = ((cpu.stkp - 1) & 0xff) as UInt8;

  cpu.pc = cpu.addr_abs;
  return 0;
};

// Instruction: Load The Accumulator
// Function:    A = M
// Flags Out:   N, Z
const LDA: Operator = (cpu) => {
  cpu.fetch();
  cpu.a = cpu.fetched;
  cpu.setFlag(SF_ZERO, cpu.a === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.a & 0x80));
  return 1;
};

// Instruction: Load The X Register
// Function:    X = M
// Flags Out:   N, Z
const LDX: Operator = (cpu) => {
  cpu.fetch();
  cpu.x = cpu.fetched;
  cpu.setFlag(SF_ZERO, cpu.x === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.x & 0x80));
  return 1;
};

// Instruction: Load The Y Register
// Function:    Y = M
// Flags Out:   N, Z
const LDY: Operator = (cpu) => {
  cpu.fetch();
  cpu.y = cpu.fetched;
  cpu.setFlag(SF_ZERO, cpu.y === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.y & 0x80));
  return 1;
};

/**
 * Shift One Bit Right (Memory or Accumulator)
 */
const LSR: Operator = (cpu) => {
  cpu.fetch();
  cpu.setFlag(SF_CARRY, !!(cpu.fetched & 0x0001));
  const temp = cpu.fetched >> 1;
  cpu.setFlag(SF_ZERO, (temp & 0x00ff) === 0x0000);
  cpu.setFlag(SF_NEGATIVE, !!(temp & 0x0080));
  if (lookup[cpu.opcode]![2] === IMP) {
    cpu.a = (temp & 0x00ff) as UInt8;
  } else {
    cpu.write(cpu.addr_abs, (temp & 0x00ff) as UInt8);
  }
  return 0;
};

const NOP: Operator = (cpu) => {
  // Sadly not all NOPs are equal, Ive added a few here
  // based on https://wiki.nesdev.com/w/index.php/CPU_unofficial_opcodes
  // and will add more based on game compatibility, and ultimately
  // I'd like to cover all illegal opcodes too
  switch (cpu.opcode) {
    case 0x1c:
    case 0x3c:
    case 0x5c:
    case 0x7c:
    case 0xdc:
    case 0xfc:
      return 1;
    default:
      return 0;
  }
};

// Instruction: Bitwise Logic OR
// Function:    A = A | M
// Flags Out:   N, Z
const ORA: Operator = (cpu) => {
  cpu.fetch();
  cpu.a = (cpu.a | cpu.fetched) as UInt8;
  cpu.setFlag(SF_ZERO, cpu.a === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.a & 0x80));
  return 1;
};

// Instruction: Push Accumulator to Stack
// Function:    A -> stack
const PHA: Operator = (cpu) => {
  cpu.write((0x0100 + cpu.stkp) as UInt16, cpu.a);
  cpu.stkp = ((cpu.stkp - 1) & 0xff) as UInt8;
  return 0;
};

// Instruction: Push Status Register to Stack
// Function:    status -> stack
// Note:        Break flag is set to 1 before push
const PHP: Operator = (cpu) => {
  // TODO: why unused? how dow other emulators do it?
  cpu.write((0x0100 + cpu.stkp) as UInt16, (cpu.status | SF_BREAK_COMMAND | SF_UNUSED) as UInt8);
  cpu.setFlag(SF_BREAK_COMMAND, false);
  // TODO: why unused? how dow other emulators do it?
  cpu.setFlag(SF_UNUSED, false);
  cpu.stkp = ((cpu.stkp - 1) & 0xff) as UInt8;
  return 0;
};

// Instruction: Pop Accumulator off Stack
// Function:    A <- stack
// Flags Out:   N, Z
const PLA: Operator = (cpu) => {
  cpu.stkp = ((cpu.stkp + 1) & 0xff) as UInt8;
  cpu.a = cpu.read((0x0100 + cpu.stkp) as UInt16);
  cpu.setFlag(SF_ZERO, cpu.a === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.a & 0x80));
  return 0;
};

// Instruction: Pop Status Register off Stack
// Function:    Status <- stack
const PLP: Operator = (cpu) => {
  cpu.stkp = ((cpu.stkp + 1) & 0xff) as UInt8;
  cpu.status = cpu.read((0x0100 + cpu.stkp) as UInt16);
  // TODO: why unused? how dow other emulators do it?
  cpu.setFlag(SF_UNUSED, true);
  return 0;
};

/**
 * Rotate One Bit Left (Memory or Accumulator)
 */
const ROL: Operator = (cpu) => {
  cpu.fetch();
  const temp = (cpu.fetched << 1) | (cpu.getFlag(SF_CARRY) ? 1 : 0);
  cpu.setFlag(SF_CARRY, !!(temp & 0xff00));
  cpu.setFlag(SF_ZERO, (temp & 0x00ff) === 0x0000);
  cpu.setFlag(SF_NEGATIVE, !!(temp & 0x0080));
  if (lookup[cpu.opcode]![2] === IMP) {
    cpu.a = (temp & 0x00ff) as UInt8;
  } else {
    cpu.write(cpu.addr_abs, (temp & 0x00ff) as UInt8);
  }
  return 0;
};

/**
 * Rotate One Bit Right (Memory or Accumulator)
 */
const ROR: Operator = (cpu) => {
  cpu.fetch();
  const temp = ((cpu.getFlag(SF_CARRY) ? 1 : 0) << 7) | (cpu.fetched >> 1);
  cpu.setFlag(SF_CARRY, !!(cpu.fetched & 0x01));
  cpu.setFlag(SF_ZERO, (temp & 0x00ff) === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(temp & 0x0080));
  if (lookup[cpu.opcode]![2] === IMP) {
    cpu.a = (temp & 0x00ff) as UInt8;
  } else {
    cpu.write(cpu.addr_abs, (temp & 0x00ff) as UInt8);
  }
  return 0;
};

/**
 * The status register is pulled with the break flag
 * and bit 5 ignored. Then PC is pulled from the stack.
 */
const RTI: Operator = (cpu) => {
  cpu.stkp = ((cpu.stkp + 1) & 0xff) as UInt8;
  cpu.status = cpu.read((0x0100 + cpu.stkp) as UInt16);
  cpu.status = (cpu.status & ~SF_BREAK_COMMAND) as UInt8;
  cpu.status = (cpu.status & ~SF_UNUSED) as UInt8;

  cpu.stkp = ((cpu.stkp + 1) & 0xff) as UInt8;
  const lo = cpu.read((0x0100 + cpu.stkp) as UInt16);
  cpu.stkp = ((cpu.stkp + 1) & 0xff) as UInt8;
  const hi = cpu.read((0x0100 + cpu.stkp) as UInt16) << 8;

  cpu.pc = (lo | hi) as UInt16;
  return 0;
};

/**
 * Return from Subroutine
 */
const RTS: Operator = (cpu) => {
  cpu.stkp = ((cpu.stkp + 1) & 0xff) as UInt8;
  const lo = cpu.read((0x0100 + cpu.stkp) as UInt16);
  cpu.stkp = ((cpu.stkp + 1) & 0xff) as UInt8;
  const hi = cpu.read((0x0100 + cpu.stkp) as UInt16) << 8;

  cpu.pc = (lo | hi) as UInt16;
  cpu.pc++;
  return 0;
};

// Instruction: Set Carry Flag
// Function:    C = 1
const SEC: Operator = (cpu) => {
  cpu.setFlag(SF_CARRY, true);
  return 0;
};

// Instruction: Set Decimal Flag
// Function:    D = 1
const SED: Operator = (cpu) => {
  cpu.setFlag(SF_DECIMAL_MODE, true);
  return 0;
};

// Instruction: Set Interrupt Flag / Enable Interrupts
// Function:    I = 1
const SEI: Operator = (cpu) => {
  cpu.setFlag(SF_IRQ_DISABLE, true);
  return 0;
};

// Instruction: Store Accumulator at Address
// Function:    M = A
const STA: Operator = (cpu) => {
  cpu.write(cpu.addr_abs, cpu.a);
  return 0;
};

// Instruction: Store X Register at Address
// Function:    M = X
const STX: Operator = (cpu) => {
  cpu.write(cpu.addr_abs, cpu.x);
  return 0;
};

// Instruction: Store Y Register at Address
// Function:    M = Y
const STY: Operator = (cpu) => {
  cpu.write(cpu.addr_abs, cpu.y);
  return 0;
};

// Instruction: Transfer Accumulator to X Register
// Function:    X = A
// Flags Out:   N, Z
const TAX: Operator = (cpu) => {
  cpu.x = cpu.a;
  cpu.setFlag(SF_ZERO, cpu.x === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.x & 0x80));
  return 0;
};

// Instruction: Transfer Accumulator to Y Register
// Function:    Y = A
// Flags Out:   N, Z
const TAY: Operator = (cpu) => {
  cpu.y = cpu.a;
  cpu.setFlag(SF_ZERO, cpu.y === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.y & 0x80));
  return 0;
};

// Instruction: Transfer Stack Pointer to X Register
// Function:    X = stack pointer
// Flags Out:   N, Z
const TSX: Operator = (cpu) => {
  cpu.x = cpu.stkp;
  cpu.setFlag(SF_ZERO, cpu.x === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.x & 0x80));
  return 0;
};

// Instruction: Transfer X Register to Accumulator
// Function:    A = X
// Flags Out:   N, Z
const TXA: Operator = (cpu) => {
  cpu.a = cpu.x;
  cpu.setFlag(SF_ZERO, cpu.a === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.a & 0x80));
  return 0;
};

// Instruction: Transfer X Register to Stack Pointer
// Function:    stack pointer = X
const TXS: Operator = (cpu) => {
  cpu.stkp = cpu.x;
  return 0;
};

// Instruction: Transfer Y Register to Accumulator
// Function:    A = Y
// Flags Out:   N, Z
const TYA: Operator = (cpu) => {
  cpu.a = cpu.y;
  cpu.setFlag(SF_ZERO, cpu.a === 0x00);
  cpu.setFlag(SF_NEGATIVE, !!(cpu.a & 0x80));
  return 0;
};

// I capture all "unofficial" opcodes with this function. It is
// functionally identical to a NOP
const XXX: Operator = () => {
  return 0;
};

// It is 16x16 entries. This gives 256 instructions. It is arranged to that the bottom
// 4 bits of the instruction choose the column, and the top 4 bits choose the row.

// prettier-ignore
export const lookup: Instruction[] = [
  [ "BRK", BRK, IMP, 7 ],[ "ORA", ORA, IZX, 6 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "???", NOP, IMP, 3 ],[ "ORA", ORA, ZP0, 3 ],[ "ASL", ASL, ZP0, 5 ],[ "???", XXX, IMP, 5 ],[ "PHP", PHP, IMP, 3 ],[ "ORA", ORA, IMM, 2 ],[ "ASL", ASL, IMP, 2 ],[ "???", XXX, IMP, 2 ],[ "???", NOP, IMP, 4 ],[ "ORA", ORA, ABS, 4 ],[ "ASL", ASL, ABS, 6 ],[ "???", XXX, IMP, 6 ],
  [ "BPL", BPL, REL, 2 ],[ "ORA", ORA, IZY, 5 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "???", NOP, IMP, 4 ],[ "ORA", ORA, ZPX, 4 ],[ "ASL", ASL, ZPX, 6 ],[ "???", XXX, IMP, 6 ],[ "CLC", CLC, IMP, 2 ],[ "ORA", ORA, ABY, 4 ],[ "???", NOP, IMP, 2 ],[ "???", XXX, IMP, 7 ],[ "???", NOP, IMP, 4 ],[ "ORA", ORA, ABX, 4 ],[ "ASL", ASL, ABX, 7 ],[ "???", XXX, IMP, 7 ],
  [ "JSR", JSR, ABS, 6 ],[ "AND", AND, IZX, 6 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "BIT", BIT, ZP0, 3 ],[ "AND", AND, ZP0, 3 ],[ "ROL", ROL, ZP0, 5 ],[ "???", XXX, IMP, 5 ],[ "PLP", PLP, IMP, 4 ],[ "AND", AND, IMM, 2 ],[ "ROL", ROL, IMP, 2 ],[ "???", XXX, IMP, 2 ],[ "BIT", BIT, ABS, 4 ],[ "AND", AND, ABS, 4 ],[ "ROL", ROL, ABS, 6 ],[ "???", XXX, IMP, 6 ],
  [ "BMI", BMI, REL, 2 ],[ "AND", AND, IZY, 5 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "???", NOP, IMP, 4 ],[ "AND", AND, ZPX, 4 ],[ "ROL", ROL, ZPX, 6 ],[ "???", XXX, IMP, 6 ],[ "SEC", SEC, IMP, 2 ],[ "AND", AND, ABY, 4 ],[ "???", NOP, IMP, 2 ],[ "???", XXX, IMP, 7 ],[ "???", NOP, IMP, 4 ],[ "AND", AND, ABX, 4 ],[ "ROL", ROL, ABX, 7 ],[ "???", XXX, IMP, 7 ],
  [ "RTI", RTI, IMP, 6 ],[ "EOR", EOR, IZX, 6 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "???", NOP, IMP, 3 ],[ "EOR", EOR, ZP0, 3 ],[ "LSR", LSR, ZP0, 5 ],[ "???", XXX, IMP, 5 ],[ "PHA", PHA, IMP, 3 ],[ "EOR", EOR, IMM, 2 ],[ "LSR", LSR, IMP, 2 ],[ "???", XXX, IMP, 2 ],[ "JMP", JMP, ABS, 3 ],[ "EOR", EOR, ABS, 4 ],[ "LSR", LSR, ABS, 6 ],[ "???", XXX, IMP, 6 ],
  [ "BVC", BVC, REL, 2 ],[ "EOR", EOR, IZY, 5 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "???", NOP, IMP, 4 ],[ "EOR", EOR, ZPX, 4 ],[ "LSR", LSR, ZPX, 6 ],[ "???", XXX, IMP, 6 ],[ "CLI", CLI, IMP, 2 ],[ "EOR", EOR, ABY, 4 ],[ "???", NOP, IMP, 2 ],[ "???", XXX, IMP, 7 ],[ "???", NOP, IMP, 4 ],[ "EOR", EOR, ABX, 4 ],[ "LSR", LSR, ABX, 7 ],[ "???", XXX, IMP, 7 ],
  [ "RTS", RTS, IMP, 6 ],[ "ADC", ADC, IZX, 6 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "???", NOP, IMP, 3 ],[ "ADC", ADC, ZP0, 3 ],[ "ROR", ROR, ZP0, 5 ],[ "???", XXX, IMP, 5 ],[ "PLA", PLA, IMP, 4 ],[ "ADC", ADC, IMM, 2 ],[ "ROR", ROR, IMP, 2 ],[ "???", XXX, IMP, 2 ],[ "JMP", JMP, IND, 5 ],[ "ADC", ADC, ABS, 4 ],[ "ROR", ROR, ABS, 6 ],[ "???", XXX, IMP, 6 ],
  [ "BVS", BVS, REL, 2 ],[ "ADC", ADC, IZY, 5 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "???", NOP, IMP, 4 ],[ "ADC", ADC, ZPX, 4 ],[ "ROR", ROR, ZPX, 6 ],[ "???", XXX, IMP, 6 ],[ "SEI", SEI, IMP, 2 ],[ "ADC", ADC, ABY, 4 ],[ "???", NOP, IMP, 2 ],[ "???", XXX, IMP, 7 ],[ "???", NOP, IMP, 4 ],[ "ADC", ADC, ABX, 4 ],[ "ROR", ROR, ABX, 7 ],[ "???", XXX, IMP, 7 ],
  [ "???", NOP, IMP, 2 ],[ "STA", STA, IZX, 6 ],[ "???", NOP, IMP, 2 ],[ "???", XXX, IMP, 6 ],[ "STY", STY, ZP0, 3 ],[ "STA", STA, ZP0, 3 ],[ "STX", STX, ZP0, 3 ],[ "???", XXX, IMP, 3 ],[ "DEY", DEY, IMP, 2 ],[ "???", NOP, IMP, 2 ],[ "TXA", TXA, IMP, 2 ],[ "???", XXX, IMP, 2 ],[ "STY", STY, ABS, 4 ],[ "STA", STA, ABS, 4 ],[ "STX", STX, ABS, 4 ],[ "???", XXX, IMP, 4 ],
  [ "BCC", BCC, REL, 2 ],[ "STA", STA, IZY, 6 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 6 ],[ "STY", STY, ZPX, 4 ],[ "STA", STA, ZPX, 4 ],[ "STX", STX, ZPY, 4 ],[ "???", XXX, IMP, 4 ],[ "TYA", TYA, IMP, 2 ],[ "STA", STA, ABY, 5 ],[ "TXS", TXS, IMP, 2 ],[ "???", XXX, IMP, 5 ],[ "???", NOP, IMP, 5 ],[ "STA", STA, ABX, 5 ],[ "???", XXX, IMP, 5 ],[ "???", XXX, IMP, 5 ],
  [ "LDY", LDY, IMM, 2 ],[ "LDA", LDA, IZX, 6 ],[ "LDX", LDX, IMM, 2 ],[ "???", XXX, IMP, 6 ],[ "LDY", LDY, ZP0, 3 ],[ "LDA", LDA, ZP0, 3 ],[ "LDX", LDX, ZP0, 3 ],[ "???", XXX, IMP, 3 ],[ "TAY", TAY, IMP, 2 ],[ "LDA", LDA, IMM, 2 ],[ "TAX", TAX, IMP, 2 ],[ "???", XXX, IMP, 2 ],[ "LDY", LDY, ABS, 4 ],[ "LDA", LDA, ABS, 4 ],[ "LDX", LDX, ABS, 4 ],[ "???", XXX, IMP, 4 ],
  [ "BCS", BCS, REL, 2 ],[ "LDA", LDA, IZY, 5 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 5 ],[ "LDY", LDY, ZPX, 4 ],[ "LDA", LDA, ZPX, 4 ],[ "LDX", LDX, ZPY, 4 ],[ "???", XXX, IMP, 4 ],[ "CLV", CLV, IMP, 2 ],[ "LDA", LDA, ABY, 4 ],[ "TSX", TSX, IMP, 2 ],[ "???", XXX, IMP, 4 ],[ "LDY", LDY, ABX, 4 ],[ "LDA", LDA, ABX, 4 ],[ "LDX", LDX, ABY, 4 ],[ "???", XXX, IMP, 4 ],
  [ "CPY", CPY, IMM, 2 ],[ "CMP", CMP, IZX, 6 ],[ "???", NOP, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "CPY", CPY, ZP0, 3 ],[ "CMP", CMP, ZP0, 3 ],[ "DEC", DEC, ZP0, 5 ],[ "???", XXX, IMP, 5 ],[ "INY", INY, IMP, 2 ],[ "CMP", CMP, IMM, 2 ],[ "DEX", DEX, IMP, 2 ],[ "???", XXX, IMP, 2 ],[ "CPY", CPY, ABS, 4 ],[ "CMP", CMP, ABS, 4 ],[ "DEC", DEC, ABS, 6 ],[ "???", XXX, IMP, 6 ],
  [ "BNE", BNE, REL, 2 ],[ "CMP", CMP, IZY, 5 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "???", NOP, IMP, 4 ],[ "CMP", CMP, ZPX, 4 ],[ "DEC", DEC, ZPX, 6 ],[ "???", XXX, IMP, 6 ],[ "CLD", CLD, IMP, 2 ],[ "CMP", CMP, ABY, 4 ],[ "NOP", NOP, IMP, 2 ],[ "???", XXX, IMP, 7 ],[ "???", NOP, IMP, 4 ],[ "CMP", CMP, ABX, 4 ],[ "DEC", DEC, ABX, 7 ],[ "???", XXX, IMP, 7 ],
  [ "CPX", CPX, IMM, 2 ],[ "SBC", SBC, IZX, 6 ],[ "???", NOP, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "CPX", CPX, ZP0, 3 ],[ "SBC", SBC, ZP0, 3 ],[ "INC", INC, ZP0, 5 ],[ "???", XXX, IMP, 5 ],[ "INX", INX, IMP, 2 ],[ "SBC", SBC, IMM, 2 ],[ "NOP", NOP, IMP, 2 ],[ "???", SBC, IMP, 2 ],[ "CPX", CPX, ABS, 4 ],[ "SBC", SBC, ABS, 4 ],[ "INC", INC, ABS, 6 ],[ "???", XXX, IMP, 6 ],
  [ "BEQ", BEQ, REL, 2 ],[ "SBC", SBC, IZY, 5 ],[ "???", XXX, IMP, 2 ],[ "???", XXX, IMP, 8 ],[ "???", NOP, IMP, 4 ],[ "SBC", SBC, ZPX, 4 ],[ "INC", INC, ZPX, 6 ],[ "???", XXX, IMP, 6 ],[ "SED", SED, IMP, 2 ],[ "SBC", SBC, ABY, 4 ],[ "NOP", NOP, IMP, 2 ],[ "???", XXX, IMP, 7 ],[ "???", NOP, IMP, 4 ],[ "SBC", SBC, ABX, 4 ],[ "INC", INC, ABX, 7 ],[ "???", XXX, IMP, 7 ],
]
