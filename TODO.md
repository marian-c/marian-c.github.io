- when the bus monitor is narraw enough, the header wraps and the contents don't, the header should not wrap
- add snack notifications for compilation, compile & load, example loading, uploading
- stack pointer overrun: warn, break


a number can be:

- hex, dec, bin
- byte, address
- address can be a label

add tests for symbol definition

make localstorage stuff work with incognito mode

what happens with background tabs - make the driver resilient to throttled timers

see if the global error reporting of nextjs is still available on prod, or try to replicate it

const TODO = `
.org $1234 ; with comment

.org $1234
.org $1233 ;; error - not ordered

;; error overlap

;; error length of address

.org $1234
.org $1239

.org $1234 $ab ;; error - first .org can not have fill value - if on first line

lda $abcd
.org $1234

lda $abcd
.org $0000 ;; error, out of order


.org $1234
.org $2000 $ea


.org $1234
.org $2345
.org $3456 $ea

.org $1234
.org $2345 $ff
.org $3456 $ea

.org $1234
.org $2345 $ff
.org $3456 $ff

.org $1234
.org $2345 $00
.org $3456 $00


.org ;comment

.org;comment


`


new directive to include precompiled stuff, like wozmon

```
.load-bin "wozmon"
```


- in the parse functions, I don't need to trim if I don't look at the value and just pass it along
  Only parse functions that execute regexp or look at the value should trim


Variables should be case-insensitive


tighter integration between source and rom viewer - mark sections that come from compilation vs sections left alone, 
maybe color code rom section with corresponding sections/labels from the source


get all icons from https://iconduck.com/
