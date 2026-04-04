---
layout: post
tags:
- snes
- fileformats
title: Super Famicom / SNES File Formats
category: snes
permalink: /snes-file-formats
breadcrumbs:
  - name: Home
    url: /
  - name: Super Nintendo (Super Famicom)
    url: /snes
  - name: SNES File Formats
    url: #
recommend:
- snes
- fileformats
editlink: /consoles/snes/SNESFileFormats.md
updatedAt: '2026-04-02'
excerpt: SNES workstation file formats, decoded and visualized
---

# Super Famicom / SNES File Formats
This page is a practical reference for common SNES file formats used for developing games, including source code files (.ASM), audio files and artwork assets such as palettes, tiles, screen layout, object layout, and CAD-side metadata.

---
# Source and Build Files
Extension | What it is
---|---
ASM | 65c816 assembly source
DEF | shared definitions and symbol layouts
REL | relocatable object or linked module
CNF | tool configuration blobs (often project/workspace settings consumed by [SFDB](#glossary-sfdb) and wrapper scripts)
MAKE / makefile | build recipes
BAT | DOS helper scripts used by tools and pipelines

---
## Glossary of Key Terms
If you are new to SNES-era workstation and build tooling, this quick glossary should help:

* <a id="glossary-sfdb"></a>**SFDB** - A Super Famicom development-time tool used in build and debug workflows. It is typically launched as [sfdb](#glossary-sfdb) -9 <project> and expects a project configuration stored in a binary `*.cnf` file.
* **SFDB program file** - A plain-text manifest used by [sfdb](#glossary-sfdb)-adjacent tooling to list binary assets alongside the ROM addresses and sizes they should occupy. The `taraka` utility converts the manifest into a `.map` report, and `azrael` can then merge and validate multiple `.map` files for overlaps and bank overflow.

---
# 2D Artwork Files

The artwork files are all intended to be used by an internal Nintendo tool called `S-CG-CAD` or `SCAD` on a **Sony NEWS** workstation and the formats are designed to stack together:

Layer | Purpose | Usually paired with
---|---|---
COL | palette rows (colors) | CGX, SCR, OBJ
CGX | tile graphics banks | COL, SCR, OBJ
SCR | background tile placement and attributes | CGX, COL
OBJ / OBX | sprite and object placement, text-as-objects | CGX, COL
SFX | CAD-side screen metadata | SCR, OBJ, CGX, COL

These file types come from a Sony NEWS workstation art pipeline tool commonly referred to as `S-CG-CAD` or `S-CAD`. It was developed by long term Nintendo partner company SRD (Systems Research and Development).
In practice it behaves like an editor that saves multiple linked layers as separate files, rather than exporting one baked screen per save.

## S-CG-CAD
The Computer Aided Design tool known as `S-CG-CAD` or `S-CAD` was developed by long term Nintendo partner company SRD (Systems Research and Development). It was intended to un on **MIPS-based Sony NEWS** workstations, the executables themselves are **MIPS big-endian ECOFF** (often reported as "MIPSEB ECOFF executable (paged)"). 

If you have the ability to run these executables they can be found in the gigaleak in the NEWS.7z archive, specifically the NEWS_11 tape backup under the user `hino`'s home directory.

### Executable Binaries
These are all executable files shipped alongside the SRD CAD tool bundle (both MIPS ECOFF binaries and wrapper scripts).

Utility binaries:

Location | File | Type | Purpose
---|---|---|---
`srd/bin` | `azrael` | ECOFF binary | MAP overlap and bank overflow checker that merges multiple MAPs into one report, marking issues per-line and returning non-zero status on errors.
`srd/bin` | `taraka` | ECOFF binary | Converts an [sfdb](#glossary-sfdb) program file into a MAP file.
`srd/bin` | `emln` | ECOFF binary | Symbol conversion helper used by the SRD pipeline (the binary identifies itself as `emln - SFX`).
`srd/bin` | `lpf_xwdpr801ymc` | ECOFF binary | XWD-to-printer filter for the PC-PR801, intended to be used via `lpr`.
`srd/bin` | `beep` | text/script | Rings the terminal bell.
`srd/bin` | `chg` | csh script | Stream editor wrapper around `sed` that batch-edits files and keeps `.BAK` backups.
`srd/bin` | `arc` | csh script | Backup and restore wrapper using `tar` plus compression (`.Z`).
`srd/bin` | `sf` | csh script | Launches [sfdb](#glossary-sfdb) based on the single `*.cnf` in the current directory.
`srd/bin` | `srd` | shell script | Prints a human-readable list of the registered SRD commands (and points at `srd/doc/*.doc`).
`srd/bin` | `cad` | shell script | Setup hint script that reminds you to add `/usr/local/srd/cad/bin` and `/usr/local/srd/cad/options` to your PATH.
`srd/bin` | `cad_chk` | csh script | Prevents starting a second CAD instance by checking running processes before calling `cad`.
`srd/bin` | `obj_tool_chk` | csh script | Prevents starting a second OBJ tool instance by checking running processes before calling `obj_tool`.

Main CAD application binaries:

Location | File | Type | Purpose
---|---|---|---
`srd/cad/bin` | `cad` | ECOFF binary | The main S-CG-CAD editor.
`srd/cad/bin` | `cad_test` | ECOFF binary | Test build of the CAD editor.
`srd/cad/bin` | `pr_chr_B` | ECOFF binary | Printer output helper: character sheets (large).
`srd/cad/bin` | `pr_chr_M` | ECOFF binary | Printer output helper: character sheets (medium).
`srd/cad/bin` | `pr_chr_S` | ECOFF binary | Printer output helper: character sheets (small).
`srd/cad/bin` | `pr_col_B` | ECOFF binary | Printer output helper: color palettes (large).
`srd/cad/bin` | `pr_col_S` | ECOFF binary | Printer output helper: color palettes (small).
`srd/cad/bin` | `pr_scr_B` | ECOFF binary | Printer output helper: screen output (large).
`srd/cad/bin` | `pr_scr_S` | ECOFF binary | Printer output helper: screen output (small).
`srd/cad/bin` | `pr_obj__` | ECOFF binary | Printer output helper: OBJ layer.
`srd/cad/bin` | `pr_obj_Q` | ECOFF binary | Printer output helper: OBJ sequence output.
`srd/cad/bin` | `pr_pnl__` | ECOFF binary | Printer output helper: panel output (PNL).
`srd/cad/bin` | `pr_map__` | ECOFF binary | Printer output helper: map output (MAP).
`srd/cad/bin` | `tenso` | ECOFF binary | Hex/binary sender that talks to `/dev/lp0` (printer port) and validates Intel HEX-like inputs.
`srd/cad/bin` | `trans` | ECOFF binary | Another hex/binary sender with `transmit_hex` and `transmit_bin` routines, also targeting `/dev/lp0`.
`srd/cad/options` | `obj_tool` | ECOFF binary | OBJ tool ("IWAWAKI SPECIAL Ver 2.00") for sorting, control, editing, and image operations.
`srd/cad/options` | `cad_clear` | ECOFF binary | CAD clear utility (references `sfx_clear.hex`).
`srd/cad/options` | `sfx_main.OPT` | ECOFF binary | SFX option module (an executable plugin-style payload loaded from the CAD options area).
`srd/cad/environment` | `mkcad_srd` | text/script | Creates a `.CAD_SRD` workspace directory and moves CAD state files into it.

### Reverse Engineering the executables
The main `cad` executable is unfortunetly stripped (no debug symbols to get function names), however there is a `cad_test` executable that is completely unstripped!

It is a **MIPS big-endian ECOFF** executable, and its ECOFF a.out optional header has `vstamp = 0x020B`, i.e. **2.11**.

That `vstamp` is the “toolchain version stamp” written by the compiler/linker in MIPS ECOFF output, so this binary was built with a **MIPS ECOFF toolchain stamping version 2.11** (the classic vendor `cc`/`ld` style toolchain used on NEWS-OS era MIPS systems), rather than something like modern GCC/ELF.

Unfortunetly it is in ECOFF format which Ghidra has a hard time understanding so the best thing to do is to convert to an elf like so (note that despite the strip debug it will still have the names):
```
mipsel-linux-gnu-objcopy --strip-debug -O elf32-tradbigmips cad_test cad_test.elf
```

Now you can open in Ghidra and see over 2393 symbols! Of course many of these are static libraries that were compiled into the executable, the actual useful count is much lower.

### Working Trees
A common convention is that the tool keeps a per-user working area in the home directory called `.CAD_SRD`.
That folder typically contains:

* tool state and options
* CAD working pages (often numbered sets of `SCR`, `CGX`, `COL`, and `OBJ`)
* the larger `OBX` companion container in some setups
* logs such as `CAD_ERR.TXT`

That home-directory workspace is useful because it shows how the tool thinks about the data:

* `COL` is a palette bank
* `CGX` is the tile bank
* `SCR` is the composed background
* `OBJ/OBX` is the object layer
* `SFX` is per-screen metadata saved by the tool, not game runtime audio


#### Workstation to SNES Transfer Programs
The SNES graphics tools were set up to push work-in-progress data straight from a workstation to SNES development hardware.

In several leaked home directories, the CAD tool keeps a `.CAD_SRD` folder containing a small menu (`CAD_pglist.dat`) plus per-mode transfer lists (`CAD.*.LST`). Each `.LST` names a SNES-side helper program (an Intel HEX payload) and the files it expects to upload (typically `CAD-0` through `CAD-3` variants).

Transfer program | What it was used for | Expected payloads (high level)
---|---|---
sfx_main | full screen preview transfer | CGX, OBJ, COL, SCR
tl_main1 | tile and palette focused preview | CGX, OBZ, COL
tl_main2 | full screen preview but with OBZ format and CAD.DAT | CGX, OBZ, COL, SCR, CAD.DAT

`sfx_main` and `tl_main2` both transfer enough data to show a full composed screen (.SCR), but they’re aimed at different CAD workflows and they move different payload sets:
* sfx_main (the “full CAD screen” transfer) uploads CGX + OBJ + COL + SCR. It’s the only one that explicitly expects the standard .OBJ object-layout files.
* tl_main2 (the “tile/layout” transfer) uploads CGX + OBZ + COL + SCR and also a CAD.DAT blob. It uses CAD.OBZ instead of per-slot .OBJ, and it has extra per-transfer state/config via CAD.DAT.

This is a useful lens for interpreting the formats on this page: the file types were designed to be transferred as a bundle, then interpreted by a small runtime on the SNES devkit.

---
## COL Format - Color Palette
COL is a palette bank, so it stores the color data that can be used as a palette for tiles and sprite data.

It has 2 bytes per color and uses SNES `BGR555` packed color in little-endian order, allowing 16 colors per palette row.

Field | Value
---|---
Encoding | little-endian SNES BGR555
Common size | 1,024 bytes
Colors | 512 color words
Layout | 32 palette rows of 16 colors
Row slot 0 | commonly treated as transparent or backdrop-like

### Byte Layout
COL is a flat array of 16-bit color words.

Offset | Size | Meaning
---|---:|---
`0x0000` | `2` | color 0, palette row 0
`0x0002` | `2` | color 1, palette row 0
... | ... | ...
`0x001E` | `2` | color 15, palette row 0
`0x0020` | `2` | color 0, palette row 1
... | ... | ...

Each 16-bit word is packed as:

Bits | Meaning
---|---
`0-4` | red
`5-9` | green
`10-14` | blue
`15` | unused (0)

Decode rules:

* read a little-endian 16-bit value `v`
* `r5 = (v >> 0) & 0x1F`, `g5 = (v >> 5) & 0x1F`, `b5 = (v >> 10) & 0x1F`
* expand 5-bit to 8-bit with `(c5 << 3) | (c5 >> 2)`


### Interactive COL Viewer
This viewer loads a COL file and shows every row as swatches.

<rr-sandpack
  template="react-ts"
  app="/public/js/sandpack/examples/SnesColPaletteViewer.tsx">
</rr-sandpack>

---
## CGX Format - Color Graphics (Tile Data)
CGX is a raw tile graphics bank, stored from byte 0. Although the extension is CGX, it was also used for original Game Boy assets despite only being shades of grey or green.

Field | Value
---|---
Tile shape | 8x8 pixels
Bit depth | commonly 4bpp, sometimes 2bpp or 8bpp
Interpretation | planar SNES tile bitplanes

Common sizes are consistent with raw 8x8 tiles:

Size | 4bpp tiles | Notes
---|---:|---
17,664 bytes | 552 | compact text or small UI banks
34,048 bytes | 1,064 | common menu and title banks
65,792 bytes | 2,056 | large shared banks

The Nintendo CGE UI (Color Graphics Editor) explicitly shows 4bit and 8x8 editing for this data family.

<img src="/public/images/snes/SNES-CGE.jpg" class="wow slideInLeft postImage" />

This viewer renders CGX as tiles, and optionally applies a COL palette.

<rr-sandpack
  template="react-ts"
  app="/public/js/sandpack/examples/SnesCgxViewer.tsx">
</rr-sandpack>

### Byte Layout (SNES Planar Tiles)
CGX is a packed stream of 8x8 tiles with no header. Tile `N` starts at `N * bytes_per_tile`.

Bit depth | Bytes per tile | Per-row layout
---|---:|---
2bpp | `16` | 2 bytes per row, 8 rows
4bpp | `32` | 2 bytes per row for planes 0-1, then 2 bytes per row for planes 2-3
8bpp | `64` | 2 bytes per row for planes 0-1, then 2 bytes per row for planes 2-3, 4-5, 6-7

4bpp tile layout by offset:

Offset | Size | Meaning
---|---:|---
`0x00-0x0F` | `16` | bitplanes 0 and 1 for rows 0-7 (2 bytes per row)
`0x10-0x1F` | `16` | bitplanes 2 and 3 for rows 0-7 (2 bytes per row)

For a given tile, row `y` and pixel `x`:

* `bit = 7 - x`
* plane bits come from the corresponding row bytes
* combine plane bits into a palette index (0-3, 0-15, or 0-255 depending on bpp)

---
## SCR Format
SCR is a background screen composition container.

The common SCR layout is fixed-size:

Range | Size | Meaning
---|---:|---
0x0000 to 0x1FFF | 2,048 bytes | block 0, 32x32 tilemap words
0x2000 to 0x3FFF | 2,048 bytes | block 1, 32x32 tilemap words
0x4000 to 0x5FFF | 2,048 bytes | block 2, 32x32 tilemap words
0x6000 to 0x7FFF | 2,048 bytes | block 3, 32x32 tilemap words
0x8000 to 0x80FF | 256 bytes | metadata region (CAD signature often appears here)
0x8100 to 0x82FF | 512 bytes | trailer region

The main 16-bit words behave like SNES BG tilemap entries:

Bits | Meaning
---|---
0 to 9 | tile number
10 to 12 | palette row
13 | priority
14 | horizontal flip
15 | vertical flip

### Byte Layout
SCR is a fixed-size container with four packed 32x32 background tilemaps.

Each tilemap block is a 32x32 grid of 16-bit words:

* 32 x 32 = 1,024 entries
* 1,024 x 2 bytes = 2,048 bytes per block

Each entry is a 16-bit little-endian word with this bitfield layout:

Bits | Meaning
---|---
`0-9` | tile index (0-1023)
`10-12` | palette row (0-7)
`13` | priority
`14` | horizontal flip
`15` | vertical flip

If you are writing a parser:

* read 16-bit `w` little-endian
* `tile = w & 0x03FF`
* `pal = (w >> 10) & 0x07`
* `pri = (w >> 13) & 0x01`
* `hflip = (w >> 14) & 0x01`
* `vflip = (w >> 15) & 0x01`

The CAD tool UI shows the same workflow split: screen, object, map, and SFX metadata as separate operations.

<img src="/public/images/snes/CAD-TOOL-SCR.jpg" class="wow slideInLeft postImage" />

This viewer composes SCR using CGX and COL.

<rr-sandpack
  template="react-ts"
  app="/public/js/sandpack/examples/SnesScrViewer.tsx">
</rr-sandpack>

---
## OBJ and OBX Format
OBJ and OBX are framed object-layout containers used to place sprites and object-form text.

### Container Layout
In the source archives there are at least two closely related "OBJ" layouts:

* the CAD toolchain layout used alongside `.OBX` (6-byte slots)
* a printer/report tool layout (`pr_obj__`) that stores 10-byte entries and a larger frame range

Format | Record region | Frame count | Slots per frame | Bytes per slot
---|---:|---:|---:|---:
OBJ | 12,288 bytes | 32 | 64 | 6
CAD workspace OBJ | 49,152 bytes | 64 | 128 | 6
OBX | 49,152 bytes | 64 | 128 | 6

Files commonly append a CAD metadata tail after the record region.

### Entry Layout
#### CAD OBJ / OBX (6-byte slots)
Each slot is 6 bytes:

Byte | Meaning
---|---
1 | flags: bit 7 display enable, other bits tool-dependent (see notes below)
2 | group info (tool classification)
3 | Y displacement (signed 8-bit)
4 | X displacement (signed 8-bit)
5 | attributes: YXPPCCCT
6 | tile number

### Byte Layout
OBJ and OBX record regions are a flat array of 6-byte slots, grouped into frames.
Parsers should treat each slot as six independent bytes.

Slot byte | Meaning | Decode
---|---|---
`0` | flags | bit 7 display enable
`1` | group info | tool classification byte
`2` | Y | signed 8-bit (two's complement)
`3` | X | signed 8-bit (two's complement)
`4` | attributes | `YXPPCCCT`
`5` | tile number | tile index byte

Signed coordinate decode:

* `x = X` if `X < 0x80`, else `X - 0x100`
* `y = Y` if `Y < 0x80`, else `Y - 0x100`

Attribute byte bits:

Bits | Meaning
---|---
7 | vertical flip (Y)
6 | horizontal flip (X)
5 to 4 | priority (PP)
3 to 1 | palette row (CCC)
0 | tile page / name select (T)

Rendering notes:

* draw order is back-to-front (higher slot index drawn first)
* the size flag selects the SNES OAM small/large size pair, which is configurable
* VRAM and CGRAM offsets shift the tile and palette bases when the project expects an offset load
* project tooling may use a smaller or customized container, so parsers should not assume one fixed size without checking (a common heuristic is to locate the `NAK1989` tool header and treat everything before it as the record region)

#### What "size select" means on SNES
The SNES PPU chooses sprite sizes in two layers: a global mode and a per-sprite toggle.

The global mode (the `OBSEL` / `OBJSEL` register at `$2101`) defines a pair of sprite dimensions (one "small" size and one "large" size) for the whole scene. Each sprite entry then has a single size-select bit that chooses which of those two sizes to use.

Flag notes:

* CAD-side tooling clearly uses bit `0x80` in the first byte as a display/enable toggle.
* The exact bit used for "size select" differs between toolchains and file layouts:
  * In the `pr_obj__` printer/report tool, the entry flag byte uses bit `0x01` as the size-select toggle.
  * In `.OBZ`, size select is stored in bit `0x40` of OBZ byte 0 (see OBZ section below).
  * For CAD `.OBJ` / `.OBX` files, many observed assets only toggle bit `0x01` (and never set `0x40`), so treat bit `0x40` as unconfirmed for the on-disk CAD format until traced end-to-end in `obj_tool`.

#### Printer OBJ (`pr_obj__`) (10-byte entries)
The `pr_obj__` printer/report utility reads an "OBJ" region as 10-byte entries, 64 entries per frame, 64 frames:

Field | Value
---|---
Frames | 64
Entries per frame | 64
Bytes per entry | 10
Bytes per frame | `0x280`
Total OBJ region | `0xA000`

Byte layout for each 10-byte entry (what `pr_obj__` actually uses):

Offset | Meaning | Notes
---|---|---
`0` | flags | bit 7 display enable, bit 0 size select
`1` | flip selector | used as a 0..3 selector; behaves like H/V flip bits
`2` | unknown (nibble printed) | printed in report output, not used for rendering
`3` | palette/attribute nibble | used as `value << 4` and also printed as a nibble
`4` | unknown | not referenced by `pr_obj__` rendering path
`5` | Y | signed 8-bit
`6` | X | signed 8-bit
`7` | unknown | not referenced by `pr_obj__` rendering path
`8..9` | tile/character number | 16-bit; high byte selects a bank and low byte selects the tile within that bank

### Sequence Data
Some object containers also include a small sequence table used to define simple animations as a timed list of frame indices.

The sequence table is stored as fixed-size blocks of raw bytes:

Field | Value
---|---
Sequence count | 16 sequences
Sequence size | tool-dependent (see below)
Steps per sequence | tool-dependent
End marker | first pair where both bytes are zero

Byte layout for each sequence:

Offset | Size | Meaning
---|---:|---
`0x00` | `2` | duration 0, frame 0
`0x02` | `2` | duration 1, frame 1
... | ... | ...
`0x1E` | `2` | duration 15, frame 15

Each step is two bytes:

Byte | Meaning
---|---
`duration` | number of ticks to hold this frame (commonly treated as 16ms units by viewers)
`frame` | zero-based frame index to display

Common location rules:

* in many OBJ/OBX-style files with a trailing CAD tail, the table starts at `record_region_bytes + 0x100` (for example `0x3100` in a `0x3000`-byte OBJ record region)
* in OBZ files, sequence data (when present) lives in the tail region starting at `0x6000`

`pr_obj__` sequence table variant:

Field | Value
---|---
Sequence count | 16
Sequence size | `0x80` bytes each
Steps per sequence | 64 (duration, frame) pairs
Total size | `0x800` bytes

This viewer renders OBJ or OBX frames and optionally applies CGX and COL.

<rr-sandpack
  template="react-ts"
  app="/public/js/sandpack/examples/SnesObjViewer.tsx">
</rr-sandpack>

### OBZ Format
OBZ is a related container used by some CAD transfer programs (`tl_main1`, `tl_main2`) instead of per-page `.OBJ` files.

Its structure is fixed-size and frame-based:

Field | Value
---|---
Common size | `0x6A00` bytes (27,136)
Record region | `0x0000` to `0x5FFF` (24,576 bytes)
Frames | 64
Slots per frame | 64
Bytes per slot | 6
Tail region | `0x6000` to `0x69FF` (likely sequence or tool metadata)

The record region is 64 frames of `0x180` bytes each (`64 slots * 6 bytes`), matching the `fread(..., 0x180, ...)` loop used by Nintendo/SRD conversion tools.
At least one Nintendo tool (`ys_obzcnv.c` for Yoshi's Island, dated 1994-06-13) only reads the front `0x6000` bytes and ignores the tail region.

#### Entry Layout
Each slot is 6 bytes, but the field order differs from `.OBJ` / `.OBX`:

Slot byte | Meaning | Decode
---|---|---
`0` | flags and tile high nibble | bit 7 display enable, bit 6 size select, bits 0 to 3 tile high nibble
`1` | tile low byte | tile id low 8 bits
`2` | X | signed 8-bit (two's complement)
`3` | Y | signed 8-bit (two's complement)
`4` | attributes | attributes byte (the Yoshi conversion tool only consumes `0xC0` for flip flags)
`5` | group info | tool classification byte (present but not used by `ys_obzcnv.c`)

Tile decode:

* `tile12 = ((byte0 & 0x0F) << 8) | byte1`

Signed coordinate decode is the same as OBJ/OBX:

* `x = X` if `X < 0x80`, else `X - 0x100`
* `y = Y` if `Y < 0x80`, else `Y - 0x100`

Yoshi's Island toolchain notes:

* A conversion tool treats `tile12 == 0x24A` as an end/invalid marker for the current frame: it stops scanning the frame and forces the frame's sprite count to 0 (effectively hiding the frame).
* The same tool treats `tile12 == 0x22E` and `tile12 == 0x24E` as special "baby" / "egg" position markers, captured into separate tables rather than emitted as normal sprite entries.

---
## SFX Format
SFX is CAD-side screen metadata, stored per-screen rather than as a single global project file.

Field | Value
---|---
Common size | 2,048 bytes
Header | ASCII signature often begins with NAK1989 S-CG-CADVer...
Structure | multi-block serialized metadata for one screen

### Byte Layout
SFX is not fully field-decoded yet, but its outer structure is stable enough for a parser to split safely.

Offset | Size | Meaning
---|---:|---
`0x0000` | `0x30` | ASCII tool header (commonly begins with `NAK1989 S-CG-CADVer...`)
`0x0030` | varies | tool-defined blocks, flags, and screen-specific payload regions

A common block pattern is:

Range | Meaning
---|---
0x0000 to about 0x002F | ASCII header
0x0030 onward | small flags and counters
0x0100 onward | control blocks
later regions | screen-specific payload blocks

---
## Mode 7 and Map-Side Formats
Extension | What it is
---|---
MD7 | raw Mode 7 map bodies (commonly 32,768 bytes)
MAP | editable map-side resources used by tools and build pipelines

### Byte Layout
MD7 files are commonly raw fixed-size blobs with no header.
A practical parser reads the full 32,768 bytes and then interprets it based on the project's tooling, often as a grid of little-endian 16-bit values.
The exact grid dimensions and meaning depend on the project.

---
## Revision Markers
Marker | Meaning
---|---
BAK | saved backup revision, often meaningful
old | older saved revision, rarer but valuable

---
## What Still Needs More Work
Some parts of the workstation ecosystem are still better described as formats than fully decoded specs:

* exact field meanings inside SFX blocks
* the relationship between OBJ and OBX in the CAD workspace
* CAD tool state files such as cadd and caddat
* MAP packing rules in specific projects
