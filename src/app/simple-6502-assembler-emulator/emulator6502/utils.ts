import { busDeviceParams } from '@/emulator/bus';
import { v4 as uuidv4 } from 'uuid';
import { type UInt16 } from '@/vendor-in/my-emulator/_/numbers';
import type { ComputerConfiguration } from '@/app/simple-6502-assembler-emulator/emulator6502/types';

const defaultId = uuidv4();
export const defaultComputerConfiguration: ComputerConfiguration = {
  busConfiguration: {
    devices: [
      busDeviceParams<'BusDeviceLCDDirect'>(defaultId, 'BusDeviceLCDDirect', [
        { startAddress: 0x6000 as UInt16, instanceName: 'LCD at 0x6000', instanceId: defaultId },
      ]),
    ],
  },
};

export const defaultSourceCode = `
; Shows the message "Hello, World" on a character LCD

.org $0010
LCD_CLEAR       = %110000000000000
LCD_RS          = %110000000000010
LCD_ENABLE      = %110000000000001
LCD_ENABLE_RS   = %110000000000011
reset:
    LDA #%00111000  ; set 8bit mode, 2 line display, 5x8 font
    STA LCD_CLEAR
    STA LCD_ENABLE
    STA LCD_CLEAR

    LDA #%00001000  ; display on, cursor on, blink off
    STA LCD_CLEAR
    STA LCD_ENABLE
    STA LCD_CLEAR

    LDA #%00000110  ; increment and shift cursor, don't shift display
    STA LCD_CLEAR
    STA LCD_ENABLE
    STA LCD_CLEAR

    LDA #"H"
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS


    LDA #"e"
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS


    LDA #"l"
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS


    LDA #"l"
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS


    LDA #"o"
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS


    LDA #","
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS

    LDA #" "
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS

    LDA #"W"
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS

    LDA #"o"
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS

    LDA #"r"
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS

    LDA #"l"
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS

    LDA #"d"
    STA LCD_RS
    STA LCD_ENABLE_RS
    STA LCD_RS

end:
    JMP end

     
.org $fffc
.word reset
`;

// TODO: also define a precompiled binary for this sample code to load
