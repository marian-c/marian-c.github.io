
Instructions

Load the 48 KB binary into your emulator's memory space at $4000, which leaves 16 KB of read-write RAM below it. When the test has finished executing, the value in address $0210 should be $FF, if your CPU passed. You will know that the test is finished when the program counter (PC) has reached address $45C0.



References:
https://www.nesdev.org/wiki/Visual6502wiki/6502TestPrograms
I downlaoded compiled version from another user
https://codegolf.stackexchange.com/questions/12844/emulate-a-mos-6502-cpu