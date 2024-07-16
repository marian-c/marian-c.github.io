# Change Log

Notable changes to the Retro Assembler extension:

### 1.3.6
- Syntax added for these CPUs: CSC 4510, MEGA65 45GS02
- The Stack Pointer register in 65816 source code can be written either as SP or S

### 1.3.5
- Support for a new directive: .lib

### 1.3.4
- Currently VS Code doesn't use word wrap in the formatting of Code Snippets. Previously I tried to solve that by formatting the descriptions with newline characters, but when the font size is changed, the text would break incorrectly. So I've given up on this approach and will wait for the VS Code team to eventually fix this issue.

### 1.3.3
- Support for a new directive: .format

### 1.3.2
- Fix for a file extension case sensitivity issue in the builder scripts.

### 1.3.1
- Support for a new directive: .namespace

### 1.3.0
- Code Snippets support implemented for all Directives like _.macro, .segment, .byte_ etc
- Each Directive has a short description and examples that the Code Snippet selector can display.

### 1.2.0
- Syntax added for these Intel CPUs: 4004, 4040, 8008, 8080, 8085
- Command _Build & Debug_ added.
- The Commands are all registered to standard keyboard shortcuts out of the box.
- Upon launching any Command, the active document is saved automatically.

### 1.1.0
- MainFile setting added to always start compiling a specific file in the project, instead of the currently edited file.
- File paths that contain spaces are now handled correctly.

### 1.0.7
- Smaller changes made in Light and Dark themes.

### 1.0.6
- Blue theme added similar to classic DOS text editors for even more retro feels.

### 1.0.5
- Support for new directives: .encoding, .textz, .ascii, .asciiz, .print, .error

### 1.0.4
- The color of _@Local_ and _@@Regional_ labels changed from gray to a more distinctive brown. Colorization issues fixed.

### 1.0.3
- Syntax for Z80 CPU added.
- Color themes updated, Register color changed to be more distinct.

### 1.0.2
- _Build & Start_ no longer needs or uses the `retroassembler.start` user setting. It uses the -L command line switch for the assembler and utilizes the _LaunchCommand_ setting entered into the source code file.

### 1.0.1

- Syntax for 65816 CPU added.
- Octal number format (0o17) and a new binary number format (0b11001010) is now supported.
- Number separator '\_' is supported in hexadecimal and binary numbers (0b11_00_10_10).

### 1.0.0

- Initial release of the VS Code Extension.
- Syntax for 6502, 65C02 / 65SC02, Gameboy CPUs.
- Light and Dark themes.
- _Build_ and _Build & Start_ command support using the built in Terminal.
