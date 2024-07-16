/*
	6502 JavaScript emulator
	by N. Landsteiner  2005-2023, e-tradion.net / masswerk.at
	(major rewrite and refactoring in 2021, JS compatibility is still pre-ES5)

	initially loosely based -- and since rewritten -- on an
	original C source by

	  Earle F. Philhower III, Commodore 64 Emulator v0.3, (C) 1993-4

	license / disclaimer (as original C source):

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    For the GNU General Public License see the Free Software Foundation,
    Inc., 675 Mass Ave, Cambridge, MA 02139, USA.

    https://www.gnu.org/licenses/licenses.en.html#GPL
*/

'use strict';

export var cpu6502 = (function () {
  // global conf

  var stopOnIterrupt = true,
    internalCycleDelay = 0,
    fillByte = 0, // byte value to fill empty RAM with on reset
    // XXX
    useIllegalOPCs = true,
    magicConstANE = 0xef, // constant used for ANE
    magicConstLXA = 0xee, // constant used for LXA immediate
    // XXX
    emulateRORBug = false, // emulate bug of pre-1976 series
    // XXX
    emulate65C02 = false; // emulate 65C02 (no additional instructions)

  // constants

  var vecRST = 0xfffc,
    vecIRQ = 0xfffe,
    vecNMI = 0xfffa;

  var fCAR = 0x01,
    fZER = 0x02,
    fINT = 0x04,
    fDEC = 0x08,
    fBRK = 0x10,
    fOVF = 0x40,
    fNEG = 0x80,
    srMask = 0xef;

  var interruptLabels = {
    '-1': '',
    0: 'BRK',
    // XXX
    1: 'IRQ',
    // XXX
    2: 'NMI',
    3: 'JAM',
  };

  // regs & memory & status

  var ac,
    xr,
    yr,
    flags = 0x16,
    sp,
    pc,
    RAM = [],
    ROM = [],
    romMask = [],
    romEnabled = true,
    interruptLevel = -1,
    spWrap = false,
    extracycles,
    addcycles,
    processorCycles,
    stepCycles,
    jammed,
    was3CycleBranch;

  // basic memory access

  function byteAt(a) {
    return romEnabled && romMask[a] ? ROM[a] || 0 : RAM[a] || 0;
  }
  function wordAt(a) {
    return byteAt(a) | (byteAt(0xffff & (a + 1)) << 8);
  }

  // address mode accessors (compare table "addressModes")

  function mImm() {
    return pc++;
  }
  function mZpg() {
    return byteAt(pc++);
  }
  function mZpX() {
    return 0xff & (xr + byteAt(pc++));
  }
  function mZpY() {
    return 0xff & (yr + byteAt(pc++));
  }
  function mInd() {
    var al = wordAt(pc),
      ah = emulate65C02 ? 0xffff & (al + 1) : (al & 0xff00) | (0xff & (al + 1));
    pc += 2;
    return byteAt(al) | (byteAt(ah) << 8);
  }
  function mInX() {
    var a = 0xff & (byteAt(pc++) + xr);
    return byteAt(a) | (byteAt(0xff & (a + 1)) << 8);
  }
  function mInY() {
    var a0 = byteAt(pc++),
      a1 = byteAt(a0) | (byteAt(0xff & (a0 + 1)) << 8),
      a2 = (a1 + yr) & 0xffff;
    if (addcycles && (a1 & 0xff00) != (a2 & 0xff00)) extracycles++;
    return a2;
  }
  function mAbs() {
    var a = wordAt(pc);
    pc += 2;
    return a;
  }
  function mAbX() {
    var a1 = wordAt(pc),
      a2 = (a1 + xr) & 0xffff;
    pc += 2;
    if (addcycles && (a1 & 0xff00) != (a2 & 0xff00)) extracycles++;
    return a2;
  }
  function mAbY() {
    var a1 = wordAt(pc),
      a2 = (a1 + yr) & 0xffff;
    pc += 2;
    if (addcycles && (a1 & 0xff00) != (a2 & 0xff00)) extracycles++;
    return a2;
  }
  function mRel() {
    pc++;
  } // dummy, see "opGetBranchAddress()"

  // constant modes (not a function)
  var mAcc = 'ACC',
    mImp = 'IMP';

  // stack

  function stPush(z) {
    RAM[sp + 0x0100] = z & 0xff;
    sp--;
    if (sp < 0) spWrap = true;
    sp &= 0xff;
  }
  function stPop() {
    if (sp++ > 0xff) spWrap = true;
    sp &= 0xff;
    return byteAt(sp + 0x0100);
  }
  function stPushWord(z) {
    stPush((z >> 8) & 0xff);
    stPush(z & 0xff);
  }
  function stPopWord() {
    var z = stPop();
    z |= stPop() << 8;
    return z;
  }
  function stPushSR(addBreakFlag) {
    var sr = (flags | 0x20) & srMask;
    if (addBreakFlag) sr |= fBRK;
    stPush(sr);
  }
  function stPullSR() {
    flags = (stPop() & srMask) | 0x20;
  }

  // interrupt operations

  function opInterrupt(iLevel) {
    // iLevel: 0 = BRK, 1 = IRQ, 2 = NMI, 3 = jammed
    if (iLevel >= 3) {
      interruptLevel = 3;
      jammed = true;
      return;
    }
    if (iLevel < 0 || (iLevel == 1 && flags & fINT)) return;
    if (iLevel == 0) {
      // break
      stPushWord(pc + 1); // return-addr = addr + 2, 1 byte padding
      stPushSR(true);
      pc = wordAt(vecIRQ);
    } else {
      stPushWord(pc);
      stPushSR(false);
      pc = wordAt(iLevel == 1 ? vecIRQ : vecNMI);
      /*
      if (iLevel > 0) {
          processorCycles += 7;
          if (was3CycleBranch) processorCycles++;
      }
      */
    }
    flags |= fINT;
    if (emulate65C02) flags &= ~fDEC;
    interruptLevel = iLevel;
  }

  function opIRQ() {
    var a = pc;
    opInterrupt(1);
    return a;
  }

  function opNMI() {
    var a = pc;
    opInterrupt(2);
    return a;
  }

  // internal operations (flag related)

  function opGetBranchAddress() {
    // increments extracycles
    var a1 = byteAt(pc),
      a2 = (pc + 1) & 0xffff;
    a1 = a1 & 0x80 ? a2 - ((a1 ^ 0xff) + 1) : a2 + a1;
    extracycles++;
    if ((a2 & 0xff00) != (a1 & 0xff00)) extracycles++;
    else was3CycleBranch = true;
    return a1 & 0xffff;
  }

  function opBranchOnFlagClr(c) {
    if (flags & c) {
      pc++;
    } else {
      pc = opGetBranchAddress();
    }
  }
  function opBranchOnFlagSet(c) {
    if (flags & c) {
      pc = opGetBranchAddress();
    } else {
      pc++;
    }
  }

  function opClrFlag(c) {
    flags &= ~c;
  }
  function opSetFlag(c) {
    flags |= c;
  }

  function opSetNZFlags(z) {
    flags &= ~(fZER | fNEG);
    if (z == 0) {
      flags |= fZER;
    } else {
      flags |= z & 0x80;
    }
  }

  function opAdd(oper) {
    var r;
    if (flags & fDEC) {
      var l = (ac & 15) + (oper & 15) + (flags & fCAR ? 1 : 0),
        h1 = (ac >> 4) & 15,
        h2 = (oper >> 4) & 15,
        h = h1 + h2,
        s1 = h1 & 8 ? h1 - 0x0f : h1,
        s2 = h2 & 8 ? h2 - 0x0f : h2,
        s = s1 + s2;
      flags &= ~(fCAR | fOVF | fNEG | fZER);
      if (!emulate65C02) {
        if (h & 8) flags |= fNEG;
        if ((h | l) & (15 == 0)) flags |= fZER;
      }
      if (l > 9) {
        l = (l + 6) & 15;
        h++;
      }
      if (h > 9) {
        h = (h + 6) & 15;
        flags |= fCAR;
      }
      r = (h << 4) | l;
      if (emulate65C02) {
        if (r == 0) {
          flags |= fZER;
        } else {
          flags |= r & 0x80;
        }
        extracycles++;
      }
    } else {
      r = oper + ac + (flags & fCAR ? 1 : 0);
      flags &= ~(fCAR | fOVF | fNEG | fZER);
      if (r > 0xff) {
        flags |= fCAR;
        r &= 0xff;
      }
      if (r == 0) {
        flags |= fZER;
      } else {
        flags |= r & 0x80;
      }
    }
    if ((ac ^ r) & (oper ^ r) & 0x80) flags |= fOVF;
    ac = r;
  }

  function opSub(oper) {
    var r = ac - oper - (flags & fCAR ? 0 : 1),
      rb = r & 0xff;
    if (flags & fDEC) {
      var l = (ac & 15) - (oper & 15) - (flags & fCAR ? 0 : 1),
        h1 = (ac >> 4) & 15,
        h2 = (oper >> 4) & 15,
        h = h1 - h2;
      flags &= ~(fCAR | fZER | fOVF | fNEG);
      if (r >= 0) flags |= fCAR;
      if (l < 0) {
        l += 10;
        h--;
      } else if (l > 9) {
        l = (l + 6) & 15;
      }
      if (h < 0) {
        h += 10;
      } else if (h > 9) {
        h = (h + 6) & 15;
      }
      if (!emulate65C02) {
        if (rb == 0) flags |= fZER;
        if (rb & 0x80) flags |= fNEG;
      }
      r = (h << 4) | l;
      if (emulate65C02) {
        if (r == 0) {
          flags |= fZER;
        } else {
          flags |= r & 0x80;
        }
        extracycles++;
      }
    } else {
      flags &= ~(fCAR | fZER | fOVF | fNEG);
      if (r >= 0) flags |= fCAR;
      r = rb;
      if (r == 0) flags |= fZER;
      flags |= r & 0x80;
    }
    if ((ac ^ rb) & ((0xff - oper) ^ rb) & 0x80) flags |= fOVF;
    ac = r;
  }

  function opComp(r, b) {
    flags &= ~(fCAR | fZER | fNEG);
    if (r == b) {
      flags |= fCAR | fZER;
    } else if (r > b) {
      flags |= fCAR;
    }
    if (0x80 & (r - b)) flags |= fNEG;
  }

  // instructions

  function iBPL() {
    opBranchOnFlagClr(fNEG);
  }
  function iBMI() {
    opBranchOnFlagSet(fNEG);
  }
  function iBVC() {
    opBranchOnFlagClr(fOVF);
  }
  function iBVS() {
    opBranchOnFlagSet(fOVF);
  }
  function iBCC() {
    opBranchOnFlagClr(fCAR);
  }
  function iBCS() {
    opBranchOnFlagSet(fCAR);
  }
  function iBNE() {
    opBranchOnFlagClr(fZER);
  }
  function iBEQ() {
    opBranchOnFlagSet(fZER);
  }

  function iCLC() {
    opClrFlag(fCAR);
  }
  function iSEC() {
    opSetFlag(fCAR);
  }
  function iCLI() {
    opClrFlag(fINT);
  }
  function iSEI() {
    opSetFlag(fINT);
  }
  function iCLV() {
    opClrFlag(fOVF);
  }
  function iCLD() {
    opClrFlag(fDEC);
  }
  function iSED() {
    opSetFlag(fDEC);
  }

  function iORA(m) {
    const mem = m();
    const byte = byteAt(mem);
    ac |= byte;
    opSetNZFlags(ac);
  }
  function iAND(m) {
    ac &= byteAt(m());
    opSetNZFlags(ac);
  }
  function iEOR(m) {
    ac ^= byteAt(m());
    opSetNZFlags(ac);
  }
  function iBIT(m) {
    var b = byteAt(m());
    flags &= ~(fZER | fNEG | fOVF);
    if ((ac & b) == 0) flags |= fZER;
    flags |= b & (0x80 | 0x40);
  }
  function iASL(m) {
    var a,
      b,
      isAcc = m === mAcc;
    if (isAcc) {
      b = ac;
    } else {
      a = m();
      b = byteAt(a);
    }
    flags &= ~(fCAR | fNEG | fZER);
    if (b & 0x80) flags |= fCAR;
    if ((b = (b << 1) & 0xff)) {
      flags |= b & 0x80;
    } else {
      flags |= fZER;
    }
    if (isAcc) {
      ac = b;
    } else {
      RAM[a] = b;
    }
  }
  function iLSR(m) {
    var a,
      b,
      isAcc = m === mAcc;
    if (isAcc) {
      b = ac;
    } else {
      a = m();
      b = byteAt(a);
    }
    flags &= ~(fCAR | fNEG | fZER);
    flags |= b & 1;
    b = b >> 1;
    if (b == 0) flags |= fZER;
    if (isAcc) {
      ac = b;
    } else {
      RAM[a] = b;
    }
  }
  function iROL(m) {
    var a,
      b,
      isAcc = m === mAcc;
    if (isAcc) {
      b = ac;
    } else {
      a = m();
      b = byteAt(a);
    }
    if (flags & fCAR) {
      if ((b & 0x80) == 0) flags &= ~fCAR;
      b = (b << 1) | 1;
    } else {
      if (b & 0x80) flags |= fCAR;
      b = b << 1;
    }
    b &= 0xff;
    opSetNZFlags(b);
    if (isAcc) {
      ac = b;
    } else {
      RAM[a] = b;
    }
  }
  function iROR(m) {
    if (emulateRORBug) {
      // pre-June 1976 series bug
      // behaves like ASL, but shifts in 0 and preserves carry
      var c = flags & fCAR;
      flags &= ~fCAR;
      iASL(m);
      flags |= c;
      return;
    }
    var a,
      b,
      isAcc = m === mAcc;
    if (isAcc) {
      b = ac;
    } else {
      a = m();
      b = byteAt(a);
    }
    if (flags & fCAR) {
      if ((b & 1) == 0) flags &= ~fCAR;
      b = (b >> 1) | 0x80;
    } else {
      if (b & 1) flags |= fCAR;
      b = b >> 1;
    }
    opSetNZFlags(b);
    if (isAcc) {
      ac = b;
    } else {
      RAM[a] = b;
    }
  }
  function iADC(m) {
    opAdd(byteAt(m()));
  }
  function iSBC(m) {
    opSub(byteAt(m()));
  }
  function iSTA(m) {
    RAM[m()] = ac;
  }
  function iSTY(m) {
    RAM[m()] = yr;
  }
  function iSTX(m) {
    const mem = m();
    RAM[mem] = xr;
  }
  function iCPY(m) {
    opComp(yr, byteAt(m()));
  }
  function iCPX(m) {
    opComp(xr, byteAt(m()));
  }
  function iCMP(m) {
    const mem = m();
    const byte = byteAt(mem);
    opComp(ac, byte);
  }
  function iDEY() {
    yr = 0xff & (yr - 1);
    opSetNZFlags(yr);
  }
  function iDEX() {
    xr = 0xff & (xr - 1);
    opSetNZFlags(xr);
  }
  function iDEC(m) {
    var a = m(),
      b = (byteAt(a) - 1) & 0xff;
    flags &= ~(fZER | fNEG);
    if (b) {
      flags |= b & 0x80;
    } else {
      flags |= fZER;
    }
    RAM[a] = b;
  }
  function iINY() {
    yr = 0xff & (yr + 1);
    opSetNZFlags(yr);
  }
  function iINX() {
    xr = 0xff & (xr + 1);
    opSetNZFlags(xr);
  }
  function iINC(m) {
    var a = m(),
      b = (byteAt(a) + 1) & 0xff;
    flags &= ~(fZER | fNEG);
    if (b) {
      flags |= b & 0x80;
    } else {
      flags |= fZER;
    }
    RAM[a] = b;
  }
  function iLDA(m) {
    const mem = m();
    const byte = byteAt(mem);
    ac = byte;
    opSetNZFlags(ac);
  }
  function iLDY(m) {
    yr = byteAt(m());
    opSetNZFlags(yr);
  }
  function iLDX(m) {
    xr = byteAt(m());
    opSetNZFlags(xr);
  }
  function iTXA() {
    ac = xr;
    opSetNZFlags(ac);
  }
  function iTYA() {
    ac = yr;
    opSetNZFlags(ac);
  }
  function iTAY() {
    yr = ac;
    opSetNZFlags(yr);
  }
  function iTAX() {
    xr = ac;
    opSetNZFlags(xr);
  }
  function iTXS() {
    sp = xr;
  }
  function iTSX() {
    xr = sp;
    opSetNZFlags(xr);
  }
  function iPHP() {
    stPushSR(true);
  }
  function iPLP() {
    stPullSR();
  }
  function iPHA() {
    stPush(ac);
  }
  function iPLA() {
    ac = stPop();
    opSetNZFlags(ac);
  }
  function iJMP(m) {
    pc = m();
  }
  function iJSR() {
    stPushWord((pc + 1) & 0xffff);
    pc = wordAt(pc);
  }
  function iRTS() {
    pc = 0xffff & (1 + stPopWord());
  }
  function iRTI() {
    stPullSR();
    pc = stPopWord();
  }
  function iBRK() {
    opInterrupt(0);
  }
  function iNOP(m) {
    if (typeof m == 'function') m(); // advance pc, if required
  }

  // illegals
  function iJAM() {
    pc = (pc - 1) & 0xffff;
    opInterrupt(3);
  }
  function iALR(m) {
    flags &= ~(fCAR | fZER | fNEG);
    ac = byteAt(m()) & ac;
    if (ac & 1) flags |= fCAR;
    ac = ac >> 1;
    if (ac == 0) flags |= fZER;
  }
  function iANC(m) {
    ac &= byteAt(m());
    flags &= ~(fCAR | fZER | fNEG);
    if (ac & 0x80) {
      flags |= fCAR | fNEG;
    } else if (ac == 0) {
      flags |= fNEG;
    }
  }
  // XXX
  function iANE(m) {
    opSetNZFlags(ac);
    ac = (ac | magicConstANE) & xr & byteAt(m());
  }
  function iARR(m) {
    var b = byteAt(m()),
      c = flags & fCAR ? 1 : 0;
    flags &= ~(fCAR | fZER | fOVF | fNEG);
    if (flags & fDEC) {
      var r = (ac & 0x0f) + (b & 0x0f) + c;
      if (r > 9) r += 6;
      if (r <= 0xf) {
        r = (r & 0x0f) + (ac & 0xf0) + (b & 0xf0);
      } else {
        r = (r & 0x0f) + (ac & 0xf0) + (r & 0xf0) + 0x10;
      }
      if (((ac + b + c) & 0xff) == 0) flags |= fZER;
      if (r & 0x80) flags |= fNEG;
      if ((ac ^ r) & 0x80 && !((ac ^ r) & 0x80)) flags |= fOVF;
      if ((r & 0x1f0) > 0x90) r += 0x60;
      if (r & 0xff0) flags |= fCAR;
      ac = r & 0xff;
    } else {
      var r = ac & b,
        b7 = (r & 0x80) >> 7,
        b6 = (r & 0x40) >> 6;
      if (b7) flags |= fCAR;
      if (b6 ^ b7) flags |= fOVF;
      ac = (r >> 1) | (c << 7);
      if (ac & 0x80) flags |= fNEG;
      if (ac == 0) flags |= fZER;
    }
  }
  function iDCP(m) {
    var a = m(),
      b = (byteAt(a) - 1) & 0xff;
    RAM[a] = b;
    flags &= ~(fCAR | fZER | fNEG);
    if (ac == b) {
      flags |= fCAR | fZER;
    } else if (ac > b) {
      flags |= fCAR;
    }
    if (0x80 & (ac - b)) flags |= fNEG;
  }
  function iISC(m) {
    var a = m(),
      b = (byteAt(a) + 1) & 0xff;
    RAM[a] = b;
    opSub(b);
  }
  function iLAS(m) {
    ac = xr = sp = sp & byteAt(m());
    opSetNZFlags(ac);
  }
  function iLAX(m) {
    ac = xr = byteAt(m());
    opSetNZFlags(ac);
  }
  function iLXA(m) {
    opSetNZFlags(ac);
    ac = xr = (ac | magicConstLXA) & byteAt(m());
  }
  function iRLA(m) {
    var a = m(),
      b = byteAt(a),
      c = flags & fCAR ? 1 : 0;
    flags &= ~(fCAR | fNEG | fZER);
    if (b & 1) flags |= fCAR;
    b = (0xff & (b << 1)) | c;
    RAM[a] = b;
    ac &= b;
    if (ac == 0) {
      flags |= fZER;
    } else if (ac & 0x80) {
      flags |= fNEG;
    }
  }
  function iRRA(m) {
    var a = m(),
      b = byteAt(a);
    if (flags & fCAR) {
      if (b & (1 == 0)) flags &= ~fCAR;
      b = (b >> 1) | 0x80;
    } else {
      if (b & 1) flags |= fCAR;
      b = b >> 1;
    }
    RAM[a] = b;
    opAdd(b);
  }
  function iSAX(m) {
    RAM[m()] = ac & xr;
  }
  function iSBX(m) {
    var b = byteAt(m()),
      t = ac,
      f = flags & ~(fCAR | fNEG | fZER),
      r = ac & xr;
    ac = r;
    flags = (flags & ~fDEC) | fCAR;
    opSub(b);
    xr = ac;
    ac = t;
    flags = f;
    if (r >= b) flags |= fCAR;
    if (xr & 0x80) flags |= fNEG;
    if (xr == 0) flags |= fZER;
  }
  function iSHA(m) {
    var a = m(),
      h = a >> 8,
      r = ac & xr;
    if (extracycles) {
      // we assume no DMA
      r &= h;
      RAM[(r << 8) | (a & 0xff)] = r;
    } else {
      RAM[a] = r & (h + 1);
    }
  }
  function iSHX(m) {
    var a = m(),
      h = a >> 8,
      r = xr;
    if (extracycles) {
      // we assume no DMA
      r &= h;
      RAM[(r << 8) | (a & 0xff)] = r;
    } else {
      RAM[a] = r & (h + 1);
    }
  }
  function iSHY(m) {
    var a = m(),
      h = a >> 8,
      r = yr;
    if (extracycles) {
      // we assume no DMA
      r &= h;
      RAM[(r << 8) | (a & 0xff)] = r;
    } else {
      RAM[a] = r & (h + 1);
    }
  }
  function iSLO(m) {
    var a = m(),
      b = byteAt(a);
    flags &= ~(fCAR | fNEG | fZER);
    if (b & 0x80) flags |= fCAR;
    b = (b << 1) & 0xff;
    RAM[a] = b;
    ac |= b;
    if (ac == 0) {
      flags |= fZER;
    } else {
      flags |= ac & 0x80;
    }
  }
  function iSRE(m) {
    var a = m(),
      b = byteAt(a);
    flags &= ~(fCAR | fNEG | fZER);
    if (b & 1) flags |= fCAR;
    b = (b >> 1) & 0x7f;
    RAM[a] = b;
    ac ^= b;
    if (ac == 0) {
      flags |= fZER;
    } else {
      flags |= ac & 0x80;
    }
  }
  function iTAS(m) {
    sp = ac & xr;
    var a = m(),
      h = a >> 8,
      r = sp;
    if (extracycles) {
      // we assume no DMA
      r &= h;
      RAM[(r << 8) | (a & 0xff)] = r;
    } else {
      RAM[a] = r & (h + 1);
    }
  }

  // code tables

  var instructionsLegal = [
      iBRK,
      iORA,
      null,
      null,
      null,
      iORA,
      iASL,
      null, // 00
      iPHP,
      iORA,
      iASL,
      null,
      null,
      iORA,
      iASL,
      null, // 08
      iBPL,
      iORA,
      null,
      null,
      null,
      iORA,
      iASL,
      null, // 10
      iCLC,
      iORA,
      null,
      null,
      null,
      iORA,
      iASL,
      null, // 18
      iJSR,
      iAND,
      null,
      null,
      iBIT,
      iAND,
      iROL,
      null, // 20
      iPLP,
      iAND,
      iROL,
      null,
      iBIT,
      iAND,
      iROL,
      null, // 28
      iBMI,
      iAND,
      null,
      null,
      null,
      iAND,
      iROL,
      null, // 30
      iSEC,
      iAND,
      null,
      null,
      null,
      iAND,
      iROL,
      null, // 38
      iRTI,
      iEOR,
      null,
      null,
      null,
      iEOR,
      iLSR,
      null, // 40
      iPHA,
      iEOR,
      iLSR,
      null,
      iJMP,
      iEOR,
      iLSR,
      null, // 48
      iBVC,
      iEOR,
      null,
      null,
      null,
      iEOR,
      iLSR,
      null, // 50
      iCLI,
      iEOR,
      null,
      null,
      null,
      iEOR,
      iLSR,
      null, // 58
      iRTS,
      iADC,
      null,
      null,
      null,
      iADC,
      iROR,
      null, // 60
      iPLA,
      iADC,
      iROR,
      null,
      iJMP,
      iADC,
      iROR,
      null, // 68
      iBVS,
      iADC,
      null,
      null,
      null,
      iADC,
      iROR,
      null, // 70
      iSEI,
      iADC,
      null,
      null,
      null,
      iADC,
      iROR,
      null, // 78
      null,
      iSTA,
      null,
      null,
      iSTY,
      iSTA,
      iSTX,
      null, // 80
      iDEY,
      null,
      iTXA,
      null,
      iSTY,
      iSTA,
      iSTX,
      null, // 88
      iBCC,
      iSTA,
      null,
      null,
      iSTY,
      iSTA,
      iSTX,
      null, // 90
      iTYA,
      iSTA,
      iTXS,
      null,
      null,
      iSTA,
      null,
      null, // 98
      iLDY,
      iLDA,
      iLDX,
      null,
      iLDY,
      iLDA,
      iLDX,
      null, // A0
      iTAY,
      iLDA,
      iTAX,
      null,
      iLDY,
      iLDA,
      iLDX,
      null, // A8
      iBCS,
      iLDA,
      null,
      null,
      iLDY,
      iLDA,
      iLDX,
      null, // B0
      iCLV,
      iLDA,
      iTSX,
      null,
      iLDY,
      iLDA,
      iLDX,
      null, // B8
      iCPY,
      iCMP,
      null,
      null,
      iCPY,
      iCMP,
      iDEC,
      null, // C0
      iINY,
      iCMP,
      iDEX,
      null,
      iCPY,
      iCMP,
      iDEC,
      null, // C8
      iBNE,
      iCMP,
      null,
      null,
      null,
      iCMP,
      iDEC,
      null, // D0
      iCLD,
      iCMP,
      null,
      null,
      null,
      iCMP,
      iDEC,
      null, // D8
      iCPX,
      iSBC,
      null,
      null,
      iCPX,
      iSBC,
      iINC,
      null, // E0
      iINX,
      iSBC,
      iNOP,
      null,
      iCPX,
      iSBC,
      iINC,
      null, // E8
      iBEQ,
      iSBC,
      null,
      null,
      null,
      iSBC,
      iINC,
      null, // F0
      iSED,
      iSBC,
      null,
      null,
      null,
      iSBC,
      iINC,
      null, // F8
    ],
    // XXX
    instructionsAll = [
      iBRK,
      iORA,
      iJAM,
      iSLO,
      iNOP,
      iORA,
      iASL,
      iSLO, // 00
      iPHP,
      iORA,
      iASL,
      iANC,
      iNOP,
      iORA,
      iASL,
      iSLO, // 08
      iBPL,
      iORA,
      iJAM,
      iSLO,
      iNOP,
      iORA,
      iASL,
      iSLO, // 10
      iCLC,
      iORA,
      iNOP,
      iSLO,
      iNOP,
      iORA,
      iASL,
      iSLO, // 18
      iJSR,
      iAND,
      iJAM,
      iRLA,
      iBIT,
      iAND,
      iROL,
      iRLA, // 20
      iPLP,
      iAND,
      iROL,
      iANC,
      iBIT,
      iAND,
      iROL,
      iRLA, // 28
      iBMI,
      iAND,
      iJAM,
      iRLA,
      iNOP,
      iAND,
      iROL,
      iRLA, // 30
      iSEC,
      iAND,
      iNOP,
      iRLA,
      iNOP,
      iAND,
      iROL,
      iRLA, // 38
      iRTI,
      iEOR,
      iJAM,
      iSRE,
      iNOP,
      iEOR,
      iLSR,
      iSRE, // 40
      iPHA,
      iEOR,
      iLSR,
      iALR,
      iJMP,
      iEOR,
      iLSR,
      iSRE, // 48
      iBVC,
      iEOR,
      iJAM,
      iSRE,
      iNOP,
      iEOR,
      iLSR,
      iSRE, // 50
      iCLI,
      iEOR,
      iNOP,
      iSRE,
      iNOP,
      iEOR,
      iLSR,
      iSRE, // 58
      iRTS,
      iADC,
      iJAM,
      iRRA,
      iNOP,
      iADC,
      iROR,
      iRRA, // 60
      iPLA,
      iADC,
      iROR,
      iARR,
      iJMP,
      iADC,
      iROR,
      iRRA, // 68
      iBVS,
      iADC,
      iJAM,
      iRRA,
      iNOP,
      iADC,
      iROR,
      iRRA, // 70
      iSEI,
      iADC,
      iNOP,
      iRRA,
      iNOP,
      iADC,
      iROR,
      iRRA, // 78
      iNOP,
      iSTA,
      iNOP,
      iSAX,
      iSTY,
      iSTA,
      iSTX,
      iSAX, // 80
      iDEY,
      iNOP,
      iTXA,
      iANE,
      iSTY,
      iSTA,
      iSTX,
      iSAX, // 88
      iBCC,
      iSTA,
      iJAM,
      iSHA,
      iSTY,
      iSTA,
      iSTX,
      iSAX, // 90
      iTYA,
      iSTA,
      iTXS,
      iTAS,
      iSHY,
      iSTA,
      iSHX,
      iSHA, // 98
      iLDY,
      iLDA,
      iLDX,
      iLAX,
      iLDY,
      iLDA,
      iLDX,
      iLAX, // A0
      iTAY,
      iLDA,
      iTAX,
      iLXA,
      iLDY,
      iLDA,
      iLDX,
      iLAX, // A8
      iBCS,
      iLDA,
      iJAM,
      iLAX,
      iLDY,
      iLDA,
      iLDX,
      iLAX, // B0
      iCLV,
      iLDA,
      iTSX,
      iLAS,
      iLDY,
      iLDA,
      iLDX,
      iLAX, // B8
      iCPY,
      iCMP,
      iNOP,
      iDCP,
      iCPY,
      iCMP,
      iDEC,
      iDCP, // C0
      iINY,
      iCMP,
      iDEX,
      iSBX,
      iCPY,
      iCMP,
      iDEC,
      iDCP, // C8
      iBNE,
      iCMP,
      iJAM,
      iDCP,
      iNOP,
      iCMP,
      iDEC,
      iDCP, // D0
      iCLD,
      iCMP,
      iNOP,
      iDCP,
      iNOP,
      iCMP,
      iDEC,
      iDCP, // D8
      iCPX,
      iSBC,
      iNOP,
      iISC,
      iCPX,
      iSBC,
      iINC,
      iISC, // E0
      iINX,
      iSBC,
      iNOP,
      iSBC,
      iCPX,
      iSBC,
      iINC,
      iISC, // E8
      iBEQ,
      iSBC,
      iJAM,
      iISC,
      iNOP,
      iSBC,
      iINC,
      iISC, // F0
      iSED,
      iSBC,
      iNOP,
      iISC,
      iNOP,
      iSBC,
      iINC,
      iISC, // F8
    ],
    addressModes = [
      mImp,
      mInX,
      null,
      mInX,
      mZpg,
      mZpg,
      mZpg,
      mZpg, // 00
      mImp,
      mImm,
      mAcc,
      mImm,
      mAbs,
      mAbs,
      mAbs,
      mAbs, // 08
      mRel,
      mInY,
      null,
      mInY,
      mZpX,
      mZpX,
      mZpX,
      mZpX, // 10
      mImp,
      mAbY,
      mImp,
      mAbY,
      mAbX,
      mAbX,
      mAbX,
      mAbX, // 18
      mAbs,
      mInX,
      null,
      mInX,
      mZpg,
      mZpg,
      mZpg,
      mZpg, // 20
      mImp,
      mImm,
      mAcc,
      mImm,
      mAbs,
      mAbs,
      mAbs,
      mAbs, // 28
      mRel,
      mInY,
      null,
      mInY,
      mZpX,
      mZpX,
      mZpX,
      mZpX, // 30
      mImp,
      mAbY,
      mImp,
      mAbY,
      mAbX,
      mAbX,
      mAbX,
      mAbX, // 38
      mImp,
      mInX,
      null,
      mInX,
      mZpg,
      mZpg,
      mZpg,
      mZpg, // 40
      mImp,
      mImm,
      mAcc,
      mImm,
      mAbs,
      mAbs,
      mAbs,
      mAbs, // 48
      mRel,
      mInY,
      null,
      mInY,
      mZpX,
      mZpX,
      mZpX,
      mZpX, // 50
      mImp,
      mAbY,
      mImp,
      mAbY,
      mAbX,
      mAbX,
      mAbX,
      mAbX, // 58
      mImp,
      mInX,
      null,
      mInX,
      mZpg,
      mZpg,
      mZpg,
      mZpg, // 60
      mImp,
      mImm,
      mAcc,
      mImm,
      mInd,
      mAbs,
      mAbs,
      mAbs, // 68
      mRel,
      mInY,
      null,
      mInY,
      mZpX,
      mZpX,
      mZpX,
      mZpX, // 70
      mImp,
      mAbY,
      mImp,
      mAbY,
      mAbX,
      mAbX,
      mAbX,
      mAbX, // 78
      mImm,
      mInX,
      mImm,
      mInX,
      mZpg,
      mZpg,
      mZpg,
      mZpg, // 80
      mImp,
      mImm,
      mImp,
      mImm,
      mAbs,
      mAbs,
      mAbs,
      mAbs, // 88
      mRel,
      mInY,
      null,
      mInY,
      mZpX,
      mZpX,
      mZpY,
      mZpY, // 90
      mImp,
      mAbY,
      mImp,
      mAbY,
      mAbX,
      mAbX,
      mAbY,
      mAbY, // 98
      mImm,
      mInX,
      mImm,
      mInX,
      mZpg,
      mZpg,
      mZpg,
      mZpg, // A0
      mImp,
      mImm,
      mImp,
      mImm,
      mAbs,
      mAbs,
      mAbs,
      mAbs, // A8
      mRel,
      mInY,
      null,
      mInY,
      mZpX,
      mZpX,
      mZpY,
      mZpY, // B0
      mImp,
      mAbY,
      mImp,
      mAbY,
      mAbX,
      mAbX,
      mAbY,
      mAbY, // B8
      mImm,
      mInX,
      mImm,
      mInX,
      mZpg,
      mZpg,
      mZpg,
      mZpg, // C0
      mImp,
      mImm,
      mImp,
      mImm,
      mAbs,
      mAbs,
      mAbs,
      mAbs, // C8
      mRel,
      mInY,
      null,
      mInY,
      mZpX,
      mZpX,
      mZpX,
      mZpX, // D0
      mImp,
      mAbY,
      mImp,
      mAbY,
      mAbX,
      mAbX,
      mAbX,
      mAbX, // D8
      mImm,
      mInX,
      mImm,
      mInX,
      mZpg,
      mZpg,
      mZpg,
      mZpg, // E0
      mImp,
      mImm,
      mImp,
      mImm,
      mAbs,
      mAbs,
      mAbs,
      mAbs, // E8
      mRel,
      mInY,
      null,
      mInY,
      mZpX,
      mZpX,
      mZpX,
      mZpX, // F0
      mImp,
      mAbY,
      mImp,
      mAbY,
      mAbX,
      mAbX,
      mAbX,
      mAbX, // F8
    ],
    cycles = [
      7,
      6,
      0,
      8,
      3,
      3,
      5,
      5,
      3,
      2,
      2,
      2,
      4,
      4,
      6,
      6, // 00
      2,
      5,
      0,
      8,
      4,
      4,
      6,
      6,
      2,
      4,
      2,
      7,
      4,
      4,
      7,
      7, // 10
      6,
      6,
      0,
      8,
      3,
      3,
      5,
      5,
      4,
      2,
      2,
      2,
      4,
      4,
      6,
      6, // 20
      2,
      5,
      0,
      8,
      4,
      4,
      6,
      6,
      2,
      4,
      2,
      7,
      4,
      4,
      7,
      7, // 30
      6,
      6,
      0,
      8,
      3,
      3,
      5,
      5,
      3,
      2,
      2,
      2,
      3,
      4,
      6,
      6, // 40
      2,
      5,
      0,
      8,
      4,
      4,
      6,
      6,
      2,
      4,
      2,
      7,
      4,
      4,
      7,
      7, // 50
      6,
      6,
      0,
      8,
      3,
      3,
      5,
      5,
      4,
      2,
      2,
      2,
      5,
      4,
      6,
      6, // 60
      2,
      5,
      0,
      8,
      4,
      4,
      6,
      6,
      2,
      4,
      2,
      7,
      4,
      4,
      7,
      7, // 70
      2,
      6,
      2,
      6,
      3,
      3,
      3,
      3,
      2,
      2,
      2,
      2,
      4,
      4,
      4,
      4, // 80
      2,
      6,
      0,
      6,
      4,
      4,
      4,
      4,
      2,
      5,
      2,
      5,
      5,
      5,
      5,
      5, // 90
      2,
      6,
      2,
      6,
      3,
      3,
      3,
      3,
      2,
      2,
      2,
      2,
      4,
      4,
      4,
      4, // A0
      2,
      5,
      0,
      5,
      4,
      4,
      4,
      4,
      2,
      4,
      2,
      4,
      4,
      4,
      4,
      4, // B0
      2,
      6,
      2,
      8,
      3,
      3,
      5,
      5,
      2,
      2,
      2,
      2,
      4,
      4,
      6,
      6, // C0
      2,
      5,
      0,
      8,
      4,
      4,
      6,
      6,
      2,
      4,
      2,
      7,
      4,
      4,
      7,
      7, // D0
      2,
      6,
      2,
      8,
      3,
      3,
      5,
      5,
      2,
      2,
      2,
      2,
      4,
      4,
      6,
      6, // E0
      2,
      5,
      0,
      8,
      4,
      4,
      6,
      6,
      2,
      4,
      2,
      7,
      4,
      4,
      7,
      7, // F0
    ],
    extraCycles = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // 00
      2,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      1,
      1,
      0,
      0, // 10
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // 20
      2,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      1,
      1,
      0,
      0, // 30
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // 40
      2,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      1,
      1,
      0,
      0, // 50
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // 60
      2,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      1,
      1,
      0,
      0, // 70
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // 80
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // 90
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // A0
      2,
      1,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1, // B0
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // C0
      2,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      1,
      1,
      0,
      0, // D0
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0, // E0
      2,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      0,
      1,
      1,
      0,
      0, // F0
    ],
    instructions = useIllegalOPCs ? instructionsAll : instructionsLegal;

  if (emulate65C02) {
    // one cycle less with abs,x without page-crossing
    cycles[0x1e]--;
    extraCycles[0x1e] = 1; //ASL
    cycles[0x5e]--;
    extraCycles[0x5e] = 1; //LSR
    cycles[0x3e]--;
    extraCycles[0x3e] = 1; //ROL
    cycles[0x7e]--;
    extraCycles[0x7e] = 1; //ROR
  }

  // main

  function step() {
    if (jammed) return;
    var opc = byteAt(pc),
      inst = instructions[opc];
    was3CycleBranch = false;
    pc = 0xffff & (pc + 1);
    interruptLevel = -1;
    spWrap = false;
    if (inst) {
      extracycles = 0;
      addcycles = extraCycles[opc];
      inst(addressModes[opc]);
      stepCycles = cycles[opc] + extracycles;
      processorCycles += stepCycles;
      pc &= 0xffff;
      return stepCycles;
    } else {
      stepCycles = 0;
      return 0;
    }
  }

  function runLoop() {
    if (jammed) return;
    step();
    if (interruptLevel < 0 || !stopOnIterrupt) setTimeout(runLoop, internalCycleDelay);
  }

  function getStatus() {
    return {
      instruction: byteAt(pc),
      cycles: stepCycles,
      totalCycles: processorCycles,
      interruptLevel: interruptLevel,
      pc: pc,
      sp: sp,
      sr: flags | 0x30,
      a: ac,
      x: xr,
      y: yr,
      flags: getFlags(),
    };
  }

  function resetCPU() {
    pc = 0;
    sp = 0xff;
    ac = xr = yr = 0;
    flags = 0x16;
    interruptLevel = -1;
    spWrap = jammed = was3CycleBranch = false;
    processorCycles = stepCycles = 0;
  }

  // external memory access

  function clearMemory(includeROM) {
    if (fillByte) {
      for (var i = 0; i < 0x10000; i++) RAM[i] = fillByte;
    } else {
      RAM = [];
    }
    if (includeROM) resetROM();
  }

  function resetROM() {
    ROM = [];
    romMask = [];
  }

  function setFillByte(b) {
    if (typeof b === 'number') {
      fillByte = 0xff & b;
      //clearMemory(false);
    }
  }

  function setMemory(data) {
    for (var i = 0, l = Math.min(0x10000, data.length); i < l; i++) RAM[i] = (data[i] || 0) & 0xff;
  }

  function writeMemory(addr, data, isROM) {
    if (isNaN(addr)) return;
    addr &= 0xffff;
    if (isROM) {
      for (var i = 0, a = addr; i < data.length && a < 0x10000; i++, a++) {
        ROM[a] = data[i];
        romMask[a] = true;
      }
    } else {
      for (var i = 0, a = addr; i < data.length && a < 0x10000; i++, a++) RAM[a] = data[i];
    }
  }

  function readMemory(startAddr, length, ignoreROM) {
    if (isNaN(startAddr) || isNaN(length)) return null;
    startAddr &= 0xffff;
    var stopAddr = startAddr + length;
    if (stopAddr > 0x10000) stopAddr = 0x10000;
    var m = [];
    if (ignoreROM) {
      for (var a = startAddr; a < stopAddr; a++) m.push(RAM[a] || 0);
    } else {
      for (var a = startAddr; a < stopAddr; a++) m.push(readByteAt(a) || 0);
    }
    return m;
  }

  function writeByteAt(addr, v, isROM) {
    if (!isNaN(addr)) {
      addr &= 0xffff;
      if (isROM) {
        ROM[addr] = isNaN(v) ? 0 : v & 0xff;
        romMask[addr] = true;
      } else {
        RAM[addr] = isNaN(v) ? 0 : v & 0xff;
      }
    }
  }

  function readByteAt(addr, ignoreROM) {
    if (isNaN(addr)) return 0;
    addr &= 0xffff;
    if (ignoreROM) return RAM[addr];
    return romEnabled && romMask[addr] ? ROM[addr] || 0 : RAM[addr] || 0;
  }

  // external register access

  function setRegister(r, v) {
    switch (r.toLowerCase()) {
      case 'a':
        ac = v & 0xff;
        break;
      case 'x':
        xr = v & 0xff;
        break;
      case 'y':
        yr = v & 0xff;
        break;
      case 'fr':
      case 'flags':
      case 'status':
      case 'sr':
        flags = (v & 0xef) | 0x20;
        break;
      case 'sp':
        sp = v & 0xff;
        break;
      case 'pc':
        pc = v & 0xffff;
        break;
    }
  }

  function getRegister(r) {
    if (jammed) return 0xff;
    switch (r.toLowerCase()) {
      case 'a':
        return ac;
      case 'x':
        return xr;
      case 'y':
        return yr;
      case 'fr':
      case 'flags':
      case 'status':
      case 'sr':
        return flags | 0x30;
      case 'sp':
        return sp;
      case 'pc':
        return pc;
    }
  }

  function getFlags() {
    return {
      c: !!(flags & fCAR),
      z: !!(flags & fZER),
      i: !!(flags & fINT),
      d: !!(flags & fDEC),
      b: true,
      v: !!(flags & fOVF),
      n: !!(flags & fNEG),
    };
  }

  function setFlag(f, v) {
    var b = 0;
    switch (f.toLowerCase()) {
      case 'c':
        b = fCAR;
        break;
      case 'z':
        b = fZER;
        break;
      case 'i':
        b = fINT;
        break;
      case 'd':
        b = fDEC;
        break;
      case 'ov':
      case 'o':
      case 'v':
        b = fOVF;
        break;
      case 'n':
        b = fNEG;
        break;
    }
    if (b) {
      if (v) flags |= b;
      else flags &= ~b;
    }
    return flags;
  }

  function getFlag(f) {
    var b = 0;
    switch (f.toLowerCase()) {
      case 'c':
        b = fCAR;
        break;
      case 'z':
        b = fZER;
        break;
      case 'i':
        b = fINT;
        break;
      case 'd':
        b = fDEC;
        break;
      case 'b':
        return true;
      case 'ov':
      case 'o':
      case 'v':
        b = fOVF;
        break;
      case 'n':
        b = fNEG;
        break;
    }
    return !!(flags & b);
  }

  // XXX
  function useIllegalOpcodes(v) {
    useIllegalOPCs = !!v;
    instructions = useIllegalOPCs ? instructionsAll : instructionsLegal;
  }
  function usingIllegals() {
    return useIllegalOPCs;
  }

  function useRORBug(v) {
    emulateRORBug = !!v;
  }
  function usingRORBug() {
    return emulateRORBug;
  }

  function memInfo(addr) {
    addr = (addr || 0) & 0xffff;
    return {
      addr: (0x10000 | addr).toString(16).substring(1),
      RAM: (0x100 | (RAM[addr] || 0)).toString(16).substring(1),
      ROM: (0x100 | (ROM[addr] || 0)).toString(16).substring(1),
      romMask: romMask[addr] || false,
      romEnabled: romEnabled,
      effective: (0x100 | byteAt(addr)).toString(16).substring(1),
    };
  }

  function init() {
    if (fillByte) setFillByte(fillByte);
    resetCPU();
  }

  init();

  // external API

  return {
    step: step,
    run: runLoop,
    getStatus: getStatus,
    getRegister: getRegister,
    setRegister: setRegister,
    getFlags: getFlags,
    getFlag: getFlag,
    setFlag: setFlag,
    resetCPU: resetCPU,
    clearMemory: clearMemory,
    setMemory: setMemory,
    writeMemory: writeMemory,
    readMemory: readMemory,
    writeByteAt: writeByteAt,
    readByteAt: readByteAt,
    resetROM: resetROM,
    setFillByte: setFillByte,
    stopOnInterrupt: function (v) {
      stopOnIterrupt = !!v;
    },
    getInterrupt: function () {
      return interruptLabels[interruptLevel];
    },
    resetInterrupt: function () {
      interruptLevel = -1;
    },
    getCycles: function () {
      return processorCycles;
    },
    resetCycles: function () {
      processorCycles = stepCycles = 0;
    },
    setPC: function (v) {
      pc = v & 0xffff;
    },
    getPC: function () {
      return pc;
    },
    setSP: function (v) {
      sp = v & 0xff;
    },
    getSP: function () {
      return sp;
    },
    setSR: function (v) {
      flags = (v & 0xef) | 0x20;
    },
    getSR: function () {
      return flags;
    },
    setA: function (v) {
      ac = v & 0xff;
    },
    getA: function () {
      return ac;
    },
    setX: function (v) {
      xr = v & 0xff;
    },
    getX: function () {
      return xr;
    },
    setY: function (v) {
      yr = v & 0xff;
    },
    getY: function () {
      return yr;
    },
    enableROM: function (v) {
      romEnabled = !!v;
    },
    getSPWrap: function () {
      return spWrap;
    },
    irq: opIRQ,
    nmi: opNMI,
    interrupt: function (nonMaskable) {
      return (nonMaskable ? opNMI : opIRQ)();
    },
    useIllegals: useIllegalOpcodes,
    usingIllegals: usingIllegals,
    useRORBug: useRORBug,
    usingRORBug: usingRORBug,
    memInfo: memInfo,
    flags: flags,
  };
})();

// end of 6502
