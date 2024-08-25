import { IMP, lookup } from './olc6502_lookup';

import type { UInt16, UInt8 } from '../_/numbers';
import { ShouldNotHappenError } from '../_/errors';

// The status register stores 8 flags. Ive enumerated these here for ease
// of access. You can access the status register directly since its public.
// The bits have different interpretations depending upon the context and
// instruction being executed.
export const SF_CARRY = 1 << 0; // Carry Bit
export const SF_ZERO = 1 << 1; // Zero
export const SF_IRQ_DISABLE = 1 << 2; // Disable Interrupts
export const SF_DECIMAL_MODE = 1 << 3; // Decimal Mode (unused in this implementation)
export const SF_BREAK_COMMAND = 1 << 4; // Break
export const SF_UNUSED = 1 << 5; // Unused (0x20)
export const SF_OVERFLOW = 1 << 6; // Overflow
export const SF_NEGATIVE = 1 << 7; // Negative

export interface CpuMemoryBus {
  cpu: Olc6502;
  cpuWrite(address: UInt16, data: UInt8): void;
  cpuRead(address: UInt16, readOnly?: boolean): UInt8;
}

export class Olc6502 {
  // CPU Core registers, exposed as public here for ease of access from external
  // examinors. This is all the 6502 has.
  a: UInt8 = 0 as UInt8; // Accumulator Register
  x: UInt8 = 0 as UInt8; // X Register
  y: UInt8 = 0 as UInt8; // Y Register

  stkp: UInt8 = 0 as UInt8; // Stack Pointer (points to location on bus)
  pc: UInt16 = 0 as UInt16; // Program Counter
  status: UInt8 = 0 as UInt8; // Status Register

  bus: CpuMemoryBus;

  // Assisstive variables to facilitate emulation
  fetched: UInt8 = 0 as UInt8; // Represents the working input value to the ALU
  temp: UInt16 = 0x0000 as UInt16; // A convenience variable used everywhere
  addr_abs: UInt16 = 0 as UInt16; // All used memory addresses end up in here
  addr_rel: UInt16 = 0 as UInt16; // Represents absolute address following a branch
  opcode: UInt8 = 0 as UInt8; // Is the instruction byte
  cycles: number = 0; // Counts how many cycles the instruction has remaining
  clock_count: number = 0; // A global accumulation of the number of clocks

  constructor(bus: CpuMemoryBus) {
    this.bus = bus;
  }

  // Reads an 8-bit byte from the bus, located at the specified 16-bit address
  read(address: UInt16) {
    // In normal operation "read only" is set to false. This may seem odd. Some
    // devices on the bus may change state when they are read from, and this
    // is intentional under normal circumstances. However the disassembler will
    // want to read the data at an address without changing the state of the
    // devices on the bus
    return this.bus.cpuRead(address);
  }

  // Writes a byte to the bus at the specified address
  write(address: UInt16, data: UInt8) {
    return this.bus.cpuWrite(address, data);
  }

  ///////////////////////////////////////////////////////////////////////////////
  // EXTERNAL INPUTS

  // Forces the 6502 into a known state. This is hard-wired inside the CPU. The
  // registers are set to 0x00, the status register is cleared except for unused
  // bit which remains at 1. An absolute address is read from location 0xFFFC
  // which contains a second address that the program counter is set to. This
  // allows the programmer to jump to a known and programmable location in the
  // memory to start executing from. Typically the programmer would set the value
  // at location 0xFFFC at compile time.
  reset(startAddress?: UInt16): void {
    // Get address to set program counter to
    this.addr_abs = 0xfffc as UInt16;
    const lo = this.read(this.addr_abs);
    // TODO: what if it goes beyond 16 bits
    const hi = this.read((this.addr_abs + 1) as UInt16);

    // Set it
    this.pc = startAddress ?? (((hi << 8) | lo) as UInt16);

    // Reset internal registers
    this.a = 0 as UInt8;
    this.x = 0 as UInt8;
    this.y = 0 as UInt8;
    this.stkp = 0xff as UInt8;
    this.status = (SF_ZERO | SF_IRQ_DISABLE | SF_BREAK_COMMAND | SF_UNUSED) as UInt8;

    // Clear internal helper variables
    this.addr_rel = 0x0000 as UInt16;
    this.addr_abs = 0x0000 as UInt16;
    this.fetched = 0x00 as UInt8;

    // Reset takes time
    this.cycles = 8;
  }

  // Interrupt requests are a complex operation and only happen if the
  // "disable interrupt" flag is 0. IRQs can happen at any time, but
  // you dont want them to be destructive to the operation of the running
  // program. Therefore the current instruction is allowed to finish
  // (which I facilitate by doing the whole thing when cycles == 0) and
  // then the current program counter is stored on the stack. Then the
  // current status register is stored on the stack. When the routine
  // that services the interrupt has finished, the status register
  // and program counter can be restored to how they where before it
  // occurred. This is impemented by the "RTI" instruction. Once the IRQ
  // has happened, in a similar way to a reset, a programmable address
  // is read form hard coded location 0xFFFE, which is subsequently
  // set to the program counter.
  irq(): void {
    // If interrupts are allowed
    if (!this.getFlag(SF_IRQ_DISABLE)) {
      // Push the program counter to the stack. It's 16-bits dont
      // forget so that takes two pushes
      this.write((0x0100 + this.stkp) as UInt16, ((this.pc >> 8) & 0x00ff) as UInt8);
      // TODO: what if it exceeds 8bits (under/overflow)
      this.stkp--;

      this.write((0x0100 + this.stkp) as UInt16, (this.pc & 0x00ff) as UInt8);
      // TODO: what if it exceeds 8bits (under/overflow)
      this.stkp--;

      // Then Push the status register to the stack
      this.setFlag(SF_BREAK_COMMAND, false);
      this.setFlag(SF_UNUSED, true);
      this.setFlag(SF_IRQ_DISABLE, true);
      this.write((0x0100 + this.stkp) as UInt16, this.status);
      // TODO: what if it exceeds 8bits (under/overflow)
      this.stkp--;

      // Read new program counter location from fixed address
      this.addr_abs = 0xfffe as UInt16;
      const lo = this.read((this.addr_abs + 0) as UInt16);
      const hi = this.read((this.addr_abs + 1) as UInt16);
      this.pc = ((hi << 8) | lo) as UInt16;

      // IRQs take time
      this.cycles = 7;
    }
  }

  // A Non-Maskable Interrupt cannot be ignored. It behaves in exactly the
  // same way as a regular IRQ, but reads the new program counter address
  // form location 0xFFFA.
  nmi() {
    this.write((0x0100 + this.stkp) as UInt16, ((this.pc >> 8) & 0x00ff) as UInt8);
    this.stkp--;
    this.write((0x0100 + this.stkp) as UInt16, (this.pc & 0x00ff) as UInt8);
    this.stkp--;

    this.setFlag(SF_BREAK_COMMAND, false);
    this.setFlag(SF_UNUSED, true);
    this.setFlag(SF_IRQ_DISABLE, true);
    this.write((0x0100 + this.stkp) as UInt16, this.status);
    this.stkp--;

    this.addr_abs = 0xfffa as UInt16;
    const lo = this.read((this.addr_abs + 0) as UInt16);
    const hi = this.read((this.addr_abs + 1) as UInt16);
    this.pc = ((hi << 8) | lo) as UInt16;

    this.cycles = 8;
  }

  instruction(): void {
    const opCode = this.read(this.pc);

    this.opcode = opCode;

    // Always set the unused status flag bit to 1
    // this.setFlag(SF_UNUSED, true); // TODO: why?

    // TODO: what if it goes beyond the 16 bit limit?
    this.pc++;

    const instruction = lookup[opCode];
    if (instruction === undefined) {
      throw new ShouldNotHappenError(`Opcode not found in the lookup table (opcode: ${opCode})`);
    }

    this.cycles = instruction[3];
    // Perform fetch of intermmediate data using the
    // required addressing mode
    const extraCycle1 = instruction[2](this);

    // Perform operation
    const extraCycle2 = instruction[1](this);

    // The addressmode and opcode may have altered the number
    // of cycles this instruction requires before its completed
    this.cycles += extraCycle1 & extraCycle2;

    // Always set the unused status flag bit to 1
    // this.setFlag(SF_UNUSED, true); // TODO: why & why twice?
  }

  // Perform one clock cycles worth of emulation
  clockCPU(): void {
    // Each instruction requires a variable number of clock cycles to execute.
    // In my emulation, I only care about the final result and so I perform
    // the entire computation in one hit. In hardware, each clock cycle would
    // perform "microcode" style transformations of the CPUs state.
    //
    // To remain compliant with connected devices, it's important that the
    // emulation also takes "time" in order to execute instructions, so I
    // implement that delay by simply counting down the cycles required by
    // the instruction. When it reaches 0, the instruction is complete, and
    // the next one is ready to be executed.
    if (this.cycles === 0) {
      // Read next instruction byte. This 8-bit value is used to index
      // the translation table to get the relevant information about
      // how to implement the instruction
      const opCode = this.read(this.pc);

      this.opcode = opCode;

      // Always set the unused status flag bit to 1
      this.setFlag(SF_UNUSED, true); // TODO: why?

      // TODO: what if it goes beyond the 16 bit limit?
      this.pc++;

      const instruction = lookup[opCode];
      if (instruction === undefined) {
        throw new ShouldNotHappenError(`Opcode not found in the lookup table (opcode: ${opCode})`);
      }
      const [_name, operator, addressingMode, cycles] = instruction;

      this.cycles = cycles;
      // Perform fetch of intermmediate data using the
      // required addressing mode
      const extraCycle1 = addressingMode(this);

      // Perform operation
      const extraCycle2 = operator(this);

      // The addressmode and opcode may have altered the number
      // of cycles this instruction requires before its completed
      this.cycles += extraCycle1 & extraCycle2;

      // Always set the unused status flag bit to 1
      this.setFlag(SF_UNUSED, true); // TODO: why & why twice?
    }

    // Increment global clock count - This is actually unused unless logging
    // but I've kept it in because its a handy watch variable for debugging
    this.clock_count++;
    // Decrement the number of cycles remaining for this instruction
    this.cycles--;
  }

  // The read location of data can come from two sources, a memory address, or
  // its immediately available as part of the instruction. This function decides
  // depending on address mode of instruction byte
  // This function sources the data used by the instruction into
  // a convenient numeric variable. Some instructions dont have to
  // fetch data as the source is implied by the instruction. For example
  // "INX" increments the X register. There is no additional data
  // required. For all other addressing modes, the data resides at
  // the location held within addr_abs, so it is read from there.
  // Immediate adress mode exploits this slightly, as that has
  // set addr_abs = pc + 1, so it fetches the data from the
  // next byte for example "LDA $FF" just loads the accumulator with
  // 256, i.e. no far reaching memory fetch is required. "fetched"
  // is a variable global to the CPU, and is set by calling this
  // function. It also returns it for convenience.
  fetch(): UInt8 {
    const instruction = lookup[this.opcode];
    if (!instruction) {
      throw new ShouldNotHappenError(`instruction not found (opcode: ${this.opcode})`);
    }
    const addressingMode = instruction[2];

    if (addressingMode !== IMP) {
      this.fetched = this.read(this.addr_abs);
    }
    return this.fetched;
  }

  getFlag(flag: number): boolean {
    return (this.status & flag) > 0;
  }

  setFlag(flag: number, value: boolean) {
    if (value === true) {
      this.status = (this.status | flag) as UInt8;
    } else {
      this.status = (this.status & ~flag) as UInt8;
    }
  }

  // Indicates the current instruction has completed by returning true. This is
  // a utility function to enable "step-by-step" execution, without manually
  // clocking every cycle
  complete() {
    return this.cycles === 0;
  }
}
