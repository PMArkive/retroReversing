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
The Computer Aided Design tool known as `S-CG-CAD` or `S-CAD` was developed by long term Nintendo partner company **SRD** (Systems Research and Development). It was intended to un on **MIPS-based Sony NEWS** workstations, the executables themselves are **MIPS big-endian ECOFF** (often reported as "MIPSEB ECOFF executable (paged)"). 

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
`srd/cad/bin` | `cad_test` | ECOFF binary | Unstripped S-CG-CAD test build.
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
The main `cad` executable is unfortunately stripped (no debug symbols to get function names), but there is also an unstripped S-CG-CAD test build shipped as `cad_test`.

It is a **MIPS big-endian ECOFF** executable, and its ECOFF a.out optional header has `vstamp = 0x020B`, i.e. **2.11**.

That `vstamp` is the "toolchain version stamp" written by the compiler/linker in MIPS ECOFF output, so this binary was built with a **MIPS ECOFF toolchain stamping version 2.11** (the classic vendor `cc`/`ld` style toolchain used on NEWS-OS era MIPS systems), rather than something like modern GCC/ELF.

Unfortunately it is in ECOFF format which Ghidra has a hard time understanding, so the best thing to do is to convert it to an ELF like so (note that despite `--strip-debug` it will still have symbol names):
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

`sfx_main` and `tl_main2` both transfer enough data to show a full composed screen (.SCR), but they are aimed at different CAD workflows and they move different payload sets:
* sfx_main (the "full CAD screen" transfer) uploads CGX + OBJ + COL + SCR. It is the only one that explicitly expects the standard .OBJ object-layout files.
* tl_main2 (the "tile/layout" transfer) uploads CGX + OBZ + COL + SCR and also a CAD.DAT blob. It uses CAD.OBZ instead of per-slot .OBJ, and it has extra per-transfer state/config via CAD.DAT.

This is a useful lens for interpreting the formats on this page: the file types were designed to be transferred as a bundle, then interpreted by a small runtime on the SNES devkit.

---
## COL Format - Color Palette
COL is a palette bank, so it stores the color data that can be used as a palette for tiles and sprite data.

It has 2 bytes per color and uses SNES `BGR555` packed color in little-endian order, allowing 16 colors per palette row.

Field | Value
---|---
Encoding | little-endian SNES BGR555
Record region | `0x200` bytes (256 colors)
Common size | `0x400` bytes in S-CG-CAD saves (record region + tool metadata)
Colors | 256 color words
Layout | 16 palette rows of 16 colors
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

### Tool metadata (S-CG-CAD)
S-CG-CAD saves often append tool metadata after the `0x200`-byte record region, making a common on-disk size of `0x400` bytes:

Offset | Size | Meaning | Notes
---|---:|---|---
`0x0200` | `0x100` | tool header block | Observed to begin with ASCII `NAK1989 S-CG-CADVer...` in multiple assets.
`0x0300` | `0x100` | per-row tool metadata | S-CG-CAD writes `0x80` bytes of row data (32 rows x 4 bytes) and leaves the remaining bytes as reserved/zero.

In the S-CG-CAD decompile, only a small part of this metadata is clearly referenced so far. If you are writing a rewriter, preserve `0x0200..0x03FF` exactly where possible.

The per-row metadata is written as a flat table at `0x0300..0x037F`:

* 32 entries (one per palette row), 4 bytes per entry.
* Each entry is copied from the low byte of four 32-bit words in a 16-byte-per-row structure (the `save_col` decomp reads bytes at offsets `+3`, `+7`, `+0x0B`, `+0x0F` from a `0x10`-byte stride per row).
* These bytes appear to be S-CG-CAD editor-side palette table state (preview colors / attribute selectors) rather than SNES runtime palette data. The tool updates them via the palette table UI and uses `cgbank` to decide which bits are meaningful when rendering the palette table.

Important note: S-CG-CAD does not appear to read the `0x0200..0x03FF` metadata when opening a normal `.COL` via `load_col`. The metadata is still saved and is useful for round-tripping, but the decompiled tool path that restores editor state (`rstr_col`) reads a different stream shape: `0x200` bytes of color words, followed by `0x200` bytes of palette metadata, followed by a single byte written into `cgbank`.

### What `cgbank` does (S-CG-CAD)
Although the name is misleading, `cgbank` in this tool acts like a per-palette "color mode" selector that affects how the editor maps palette indices into its workstation-side 8-bit color table.

The decompiled `colors_change` routine shows three main behaviors based on `cgbank`:

* `cgbank = 0` - updates a 32-entry repeating window (`index & 0x1F`)
* `cgbank = 1` - updates a 128-entry repeating window (`index & 0x7F`)
* `cgbank = 2` - updates all 256 entries (with special-cased reserved indices like `fore`, `back`, and `mixc`)

This is editor/UI behavior, not SNES runtime palette data, but the chosen mode is still persisted in S-CG-CAD's save/backup flows.

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

S-CG-CAD also uses fixed "standard bank" CGX containers that bundle 1024 tiles plus tool metadata. These are easiest to recognize by file size:

File size | Record region | Bit depth | Tiles | Tail bytes | Notes
---|---:|---:|---:|---:|---
`0x4500` | `0x4000` | 2bpp | 1024 | `0x100` header + `0x400` per-tile table | S-CG-CAD reads 2bpp planes and ORs `tile_table[i] << 2` into each pixel index.
`0x8500` | `0x8000` | 4bpp | 1024 | `0x100` header + `0x400` per-tile table | S-CG-CAD reads SNES 4bpp planes and ORs `tile_table[i] << 4` into each pixel index.
`0x10100` | `0x10000` | 8bpp | 1024 | `0x100` header | S-CG-CAD reads SNES 8bpp planes; no per-tile table is stored in this variant.

In these S-CG-CAD variants the first `record region` bytes are still standard planar tile data and can be decoded normally. The extra `0x100` header commonly begins with ASCII `NAK1989 S-CG-CADVer...`, and the per-tile table is tool-specific metadata that affects how the editor constructs 8-bit pixel indices.

### Per-tile table (S-CG-CAD)
In the `0x4500` and `0x8500` variants, S-CG-CAD stores a 1024-byte table after the `0x100` header. Each entry is one byte per tile. The tool uses it as a per-tile "pixel index prefix":

* For 2bpp CGX (`0x4500`), S-CG-CAD combines it as `pixel_index = (tile_table[tile] << 2) | pixel_2bpp`.
* For 4bpp CGX (`0x8500`), S-CG-CAD combines it as `pixel_index = (tile_table[tile] << 4) | pixel_4bpp`.

That means the table acts like a per-tile palette selector in editor space (it chooses which group of 4 or 16 colors the tile's pixels index into), even though the underlying record region is still standard planar 2bpp/4bpp tile data.

In the 2bpp variant there is an extra twist: `save_cgx` writes the table byte as `(header_0x23 << 3) | (chars[tile] >> 2 & 7)`. Because `load_cgx` later shifts the full table byte left by 2, that effectively makes the final 8-bit editor pixel index:

* `pixel_index = (header_0x23 << 5) | ((chars[tile] >> 2 & 7) << 2) | pixel_2bpp`

This matches the preview path in `data_zoom2.c`, which adds `header_0x23 << 5` as a constant per-bank contribution.

Some bytes inside the `0x100` CGX header are set by the tool and appear to mirror editor state:

Offset | Size | Meaning | Notes
---|---:|---|---
`0x20` | `1` | `cgbank` mode | Same mode described in the COL section; affects how pixel indices are interpreted in the editor.
`0x21` | `1` | colormap bank index | Read by `load_cgx` as a 2-bit value and passed into the tool's `G_Colormap_change()` path. It is changed by the "color bank" menu and appears to select which X11 colormap bank the editor uses for previews.
`0x22` | `1` | BG/OBJ palette toggle | Read by `load_cgx` as a 1-bit value and toggled by `bg_obj_color_change()`. In the tool it is packed into the "colormap mode" bits (shifted left by 7) when installing or previewing the colormap.
`0x23` | `1` | cell index (2-bit) | Read by `load_cgx` as a 2-bit value and selected by `cell_change()` when `cgbank` is `0`. In the tool it is packed into the "colormap mode" bits (shifted left by 5) for some preview paths.

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

Each entry is a 16-bit word with this bitfield layout:

Bits | Meaning
---|---
`0-9` | tile index (0-1023)
`10-12` | palette row (0-7)
`13` | priority
`14` | horizontal flip
`15` | vertical flip

If you are writing a parser:

* read 16-bit `w` from the file
* `tile = w & 0x03FF`
* `pal = (w >> 10) & 0x07`
* `pri = (w >> 13) & 0x01`
* `hflip = (w >> 14) & 0x01`
* `vflip = (w >> 15) & 0x01`

Endianness note:

* In a ROM or 65c816 runtime context, SNES tilemap words are typically stored little-endian.
* In the S-CG-CAD `save_scr` path, the tool explicitly byte-swaps each 16-bit word before writing it, and `load_scr` swaps it back after reading. That means S-CG-CAD-authored `.SCR` files are big-endian on disk for the 16-bit tilemap words.

S-CG-CAD also writes a `0x100` metadata header (starting with ASCII `NAK1989 S-CG-CADVer...`) at `0x8000`, followed by a `0x200` trailer region. A few header bytes appear to mirror editor state:

Offset (from 0x8000) | Size | Meaning | Notes
---|---:|---|---
`0x40` | `1` | `scbank` mode | Stored as-is; decomp shows values `0..2`.
`0x41` | `1` | unknown SCR mode byte (2-bit) | Read as `header[0x41]` with `& 3`.
`0x42` | `1` | unknown SCR flag (bit 1) | Read as `header[0x42] & 2`.
`0x43` | `1` | unknown SCR mode byte (2-bit) | Read as `header[0x43] & 3`.
`0x44` | `1` | unknown SCR mode byte (2-bit) | Read as `header[0x44] & 3`.
`0x45` | `1` | unknown SCR byte | Stored as-is.
`0x46` | `1` | unknown SCR byte | Stored as-is.
`0x47..0x48` | `2` | unknown SCR 16-bit value | Read as a big-endian 16-bit value from the header bytes.

### Toolchain conversion
Some pipelines include small conversion utilities that export a CAD-authored `.SCR` into a simpler table for PC-side tooling.

One example is `stdscr.c` (header: "NEWS-CAD (SCR_File) -> STD_SCR (*.STD)", MS-DOS ver 1.11, 1992-04-13). It reads `base.SCR` as 4 blocks of `0x400` entries, but for each entry it takes one byte and discards the next byte, which effectively strips the upper byte of the 16-bit tilemap word (the byte that carries most attribute bits) and keeps the low byte.

It then repacks the four 32x32 blocks into a single `0x1000` byte output called `base.STD`:

* blocks 0 and 1 are placed side-by-side to form a 64x32 region (each 32-byte row becomes 64 bytes)
* blocks 2 and 3 are placed side-by-side to form another 64x32 region below it

In other words, this "MS-DOS screen" is not a DOS graphics format like a VGA framebuffer. It is a raw 4KB 64x64 grid of 8-bit tile indices, intended for quick viewing, printing, or importing into PC-side tools that do not need per-tile SNES attributes.

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
Extended OBJ | 24,576 bytes | 64 | 64 | 6
OBX (observed) | 49,152 bytes | 64 | 128 | 6

Files commonly append a CAD metadata tail after the record region.

### Toolchain conversion
Some projects also include small conversion utilities that turn CAD-authored `.OBX` data into assembler-friendly tables for the game runtime.

One example is `eobjcnvX.c`, which reads a full 49,152-byte `.OBX` record region (`64 * 128 * 6`), filters to slots where the "display enable" flag (byte 0 bit `0x80`) is set, applies a global X/Y offset, and writes the results out as `eobj.dat` using `BYTE` and `HEX` directives.

This is not a different on-disk `.OBX` format: it is a build-time export that (a) changes representation (text + directives rather than a binary container), and (b) intentionally alters some fields (it emits the packed word as two bytes and clears bits `0x30` in the high byte, which corresponds to dropping the priority bits in the packed attribute + tile word described below).

### Entry Layout
#### CAD OBJ / OBX (6-byte slots)
Each slot is 6 bytes. In the S-CG-CAD toolchain, bytes `4..5` are treated as a single big-endian 16-bit value, not two independent bytes.

Byte | Meaning
---|---
1 | flags: bit 7 display enable, bit 0 size select
2 | group info (tool classification)
3 | Y displacement (signed 8-bit)
4 | X displacement (signed 8-bit)
5..6 | packed attribute + tile word (big-endian, see below)

### Byte Layout
OBJ and OBX record regions are a flat array of 6-byte slots, grouped into frames.
Parsers should not assume byte `4` is the attribute byte and byte `5` is the tile byte. In the main S-CG-CAD parsing path, bytes `4..5` are decoded as a single 16-bit value.

Slot byte | Meaning | Decode
---|---|---
`0` | flags | bit 7 display enable, bit 0 size select
`1` | group info | tool classification byte
`2` | Y | signed 8-bit (two's complement)
`3` | X | signed 8-bit (two's complement)
`4..5` | packed attr + tile | big-endian 16-bit word

Flag byte notes (S-CG-CAD):

* bit `0x80` (display enable) and bit `0x01` (size select) are the only flag bits referenced in the S-CG-CAD paths traced so far.
* other bits may exist for other tools or workflows, but are not clearly interpreted in the decompiled S-CG-CAD OBJ editor logic yet.

Group info notes (S-CG-CAD):

* byte 1 is preserved on load/save, but is not clearly consumed by the S-CG-CAD editing, printing, or selection paths traced so far.
* treat it as a tool classification byte and preserve it exactly when rewriting files.
* in some observed S-CG-CAD OBJ assets, this byte is `0x00` for all slots (so it may be unused in at least some projects).
* in other observed OBJ assets, it takes small integer values (commonly `0x00..0x05`, and sometimes higher like `0x09`), suggesting it is used as a lightweight grouping or classification tag by some pipelines even if S-CG-CAD does not interpret it directly.

Signed coordinate decode:

* `x = X` if `X < 0x80`, else `X - 0x100`
* `y = Y` if `Y < 0x80`, else `Y - 0x100`

Packed attribute + tile word bits (from the S-CG-CAD decode):

Bits | Meaning
---|---
15 to 14 | flip selector (2-bit; behaves like X/Y flip, where bit 0 is X flip and bit 1 is Y flip)
13 to 12 | priority (PP)
11 to 9 | palette row (CCC)
8 to 0 | tile index (9-bit, `0x000..0x1FF`)

Rendering notes:

* draw order is back-to-front (higher slot index drawn first)
* the size flag selects the SNES OAM small/large size pair, which is configurable
* VRAM and CGRAM offsets shift the tile and palette bases when the project expects an offset load
* project tooling may use a smaller or customized container, so parsers should not assume one fixed size without checking (a common heuristic is to locate the `NAK1989` tool header and treat everything before it as the record region)
* the S-CG-CAD read/write loops walk slot indices `63` down to `0`, so the first 6 bytes in a frame correspond to slot index `63`
* in S-CG-CAD preview/image paths, the tile index high bit (bit 8) is also used as a coarse bank select: if `tileId < 0x100` it uses the per-bank "F address" base, otherwise it uses the per-bank "B address" base

Priority and palette usage notes (S-CG-CAD):

* The palette row (CCC) is used by S-CG-CAD's object image generation and preview paths (it is applied as a high-nibble / palette selection when composing pixels), and the UI can edit it for selected objects.
* The priority (PP) is editable and is printed in report output, but the S-CG-CAD on-screen selection and arrangement paths traced so far do not use it for overlap ordering (draw order is still slot-order based).

Tile banking and "F/B address" notes (S-CG-CAD preview):

* S-CG-CAD treats the tile index high bit (bit 8) as a coarse bank selector. In preview/image paths it checks `tileId >> 8`:
  * `tileId < 0x100` - uses the per-bank "F address" preset from header byte `0x55`
  * `tileId >= 0x100` - uses the per-bank "B address" preset from header byte `0x56`
* Those presets are indices into a 16-bit base table (a list of words like `0x0000, 0x0100, 0x0200, 0x0300, ...`). The selected base word is then OR'd into the character fetch address used to look up tiles in the active OBJ CGX bank.
* In other words, even though the on-disk tile id is only 9-bit, S-CG-CAD can shift the effective tile base through the header presets during preview.
* Practical interpretation for preview renderers: treat each preset as selecting a 0x100-tile page, then add the low 8 bits of the on-disk tile id:
  * `baseTiles = (preset & 0x0F) * 0x100`
  * `effectiveTile = baseTiles + (tileId & 0xFF)`
* This is S-CG-CAD tool behavior for preview and report generation, not a documented SNES OAM hardware field.

#### What "size select" means on SNES
The SNES PPU chooses sprite sizes in two layers: a global mode and a per-sprite toggle.

The global mode (the `OBSEL` / `OBJSEL` register at `$2101`) defines a pair of sprite dimensions (one "small" size and one "large" size) for the whole scene. Each sprite entry then has a single size-select bit that chooses which of those two sizes to use.

Flag notes:

* CAD-side tooling clearly uses bit `0x80` in the first byte as a display/enable toggle.
* The exact bit used for "size select" differs between toolchains and file layouts:
  * In the `pr_obj__` printer/report tool, the entry flag byte uses bit `0x01` as the size-select toggle.
  * In the S-CG-CAD CAD toolchain path (`load_obj` / `save_obj`), byte 0 bit `0x01` is also used as the size-select toggle.
  * In `.OBZ`, size select is stored in bit `0x40` of OBZ byte 0 (see OBZ section below).

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

In the S-CG-CAD toolchain, the sequence table is a fixed block stored after the `0x100` header, and it is decoded as raw (timer, frame) pairs.

Container | Total sequence table size | Sequences | Steps per sequence | Bytes per step
---|---:|---:|---:|---:
OBJ (`0x3000` record region) | `0x400` bytes | 16 | 32 | 2
Extended OBJ (`0x6000` record region) | `0x800` bytes | 16 | 64 | 2

Each step is two bytes:

Byte | Meaning | Notes
---|---|---
`0` | timer / duration | Tool UI edits this as an 8-bit value; `0x00` is treated as "unused" in printer output paths.
`1` | frame index | Treated as a 0..63 value in the UI (masked to `0x3F`); used to select which OBJ frame to preview.

The table is stored as a flat array: for each sequence (0..15), write `steps_per_sequence` steps, each step two bytes.

Common location rules:

* in OBJ/OBX-style files with a trailing S-CG-CAD tail, the sequence table starts at `record_region_bytes + 0x100` (for example `0x3100` in a `0x3000`-byte OBJ record region)
* in OBZ files, sequence data (when present) lives in the tail region starting at `0x6000`

`pr_obj__` sequence table variant:

Field | Value
---|---
Sequence count | 16
Sequence size | `0x80` bytes each
Steps per sequence | 64 (duration, frame) pairs
Total size | `0x800` bytes

### Header and per-bank settings (S-CG-CAD)
S-CG-CAD OBJ containers include an additional fixed `0x100` bytes after the record region (and before the sequence table). The tool copies a small set of bytes out of this block into per-bank state, and those values affect how it previews and edits OBJ data.

Only a few offsets are clearly referenced in the decompiled S-CG-CAD paths so far, but they are worth documenting because they are persisted on save/load:

The start of the block is a tool signature and build string in observed assets. For example, multiple OBJ files in the NEWS archives have ASCII text beginning with `NAK1989 S-CG-CADVer...` followed by a date-like string (for example `901226`).

Offset | Size | Meaning | Notes
---|---:|---|---
`0x00` | `0x20` | tool signature and version string | Observed as `NAK1989 S-CG-CADVer1.23 901226  ` (ASCII), but treat as tool metadata, not part of the sprite record format.
`0x50` | `1` | OAM size mode selector | Used as an index bit in size and hit-test tables (combined with per-sprite size bit 0).
`0x51` | `1` | CGX bank for OBJ | Masked to `& 3` on load (values `0..3`).
`0x52` | `1` | COL bank for OBJ | Masked to `& 3` on load (values `0..3`).
`0x53` | `1` | COL base/address preset | Menu-driven setting used by the OBJ color preview path.
`0x54` | `1` | V-mode selector | Used as a mode switch in selection/hit-test and preview paths. Observed values are `0` and `1` in S-CG-CAD UI menus.
`0x55` | `1` | "F address" preset | Menu-driven setting used by character-sheet preview routines.
`0x56` | `1` | "B address" preset | Menu-driven setting used by character-sheet preview routines.

Bytes outside the offsets above are not clearly consumed by the S-CG-CAD OBJ editing path yet. If you are writing an extractor or rewriter, preserve the full `0x100` block exactly where possible.

Practical notes if you are writing tools:

* **Observed tool metadata** - The leading ASCII signature/version string is stable and is best treated as CAD provenance, not sprite data.
* **Known-used settings** - The offsets `0x50..0x56` are actively used by S-CG-CAD and should be preserved if you want the tool to reopen a file consistently.
* **Unknown/reserved bytes** - Other bytes in the `0x100` block are not clearly consumed by the S-CG-CAD OBJ editing path yet. Preserve the full `0x100` block exactly where possible.

### Interactive OBJ Viewer
This viewer renders OBJ or OBX frames and optionally applies CGX and COL right inside the browser.

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
