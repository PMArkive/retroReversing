---
layout: post
tags: 
- gameboy
- fileformats
title: Game Boy File Formats (DMG, GBC)
category: gameboy
image: /public/images/GameBoy/GameBoy File Formats.jpg
twitterimage: https://www.retroreversing.com/public/images/GameBoy/GameBoy File Formats.jpg
permalink: /game-boy-file-formats
breadcrumbs:
  - name: Home
    url: /
  - name: Nintendo Game Boy (DMG & CGB)
    url: /gameboy
  - name: Game Boy File Formats
    url: #
recommend: 
- gameboy
- fileformats
editlink: /consoles/gameboy/GameBoyFileFormats.md
updatedAt: '2026-04-04'
excerpt: Find out about the most common Game Boy File formats in this post
---

# Game Boy File Formats
This page covers the main file formats that show up in official Nintendo Game Boy and Game Boy Color development material.

After looking through the Zelda DX source leak and the Super Game Boy sample package, we can now describe several of these formats much more confidently.

{% include_cached link-to-other-post.html post="/super-game-boy-sdk" description="For a compact sample project that shows many of these formats in practice, see the Super Game Boy SDK sample preserved in the Nintendo leak." %}

---
## ROM and Debug Images
The most visible Game Boy output formats are the built ROM images and the debugger-ready images used inside Nintendo's Intelligent Systems toolchain.

Extension | What it usually is | What we now know
---|---|---
`.GB` | Standard monochrome Game Boy ROM image | The raw cartridge ROM image without the extra debugger metadata carried by Nintendo's internal formats
`.GBC` | Standard Game Boy Color ROM image | Same idea as `.GB`, but usually used for color-aware retail dumps and emulator ROMs
`.ISX` | Intelligent Systems debugger-ready image | Not just a plain ROM. In leaked Nintendo projects it sits beside `.map`, `.prn`, and `isdwd*.dat` files, which suggests it was meant to be loaded by the debugger or ICE environment with symbol/debug context available
`.COM` | Generic binary output used by Nintendo build workflows | This one is more overloaded than older writeups suggested. In some folders it does look like a built executable or ROM-style output, but in the Super Game Boy sample `CHRDAT.COM` is an 8 KB graphics/tile payload loaded into bank 2, not the main program image
`.RAM` | Emulator or debugger RAM snapshot | Seen in some regional Zelda DX outputs such as `c_d.ram`, suggesting saved runtime memory for testing or debugging rather than source data

If you dump your own cartridges you will normally get `.GB` or `.GBC`.
The more interesting internal format is `.ISX`, because it belongs to the official Nintendo development flow rather than the retail cartridge image alone.

The emulator **SameBoy** recently added support to play ISX files due to the **2020 Nintendo Leaks**:
<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Following the... uh... recent events, I&#39;ve added ISX file format support to SameBoy, including symbol support <a href="https://t.co/Ba28bA2ARu">pic.twitter.com/Ba28bA2ARu</a></p>&mdash; Lior Halphon (@LIJI32) <a href="https://twitter.com/LIJI32/status/1254137545325260801?ref_src=twsrc%5Etfw">April 25, 2020</a></blockquote>

---
## Source and Build Files
The source tree itself uses a mixture of older DMG-era file types and later Color-era ones.

Extension | What it usually is | What we now know
---|---|---
`.DMG` | DMG-era assembly source module | Plain text assembly source for the original monochrome Game Boy workflow. Files like `ZMA.DMG`, `LIBDMG.DMG`, and `SGB_MAIN.DMG` are source code, not assembled outputs
`.S` | Later assembly source module | The newer source form used heavily in Color-era projects and later refreshes of older packages. In the SGB sample, the 1998 `.s` files are extremely close to the 1994 `.DMG` sources, suggesting a syntax or workflow refresh rather than a full rewrite
`.O` | Assembled object file | Built output from `.DMG` or `.s` source modules before final link
`.PRN` | Assembler listing file | A very useful debugging and archaeology format. It preserves the assembled listing and helps tie source lines to the built output
`.BAT` | DOS build or helper script | Used to edit, assemble, link, convert, or launch debugger sessions. Examples include `GAL.BAT`, `cgal.bat`, `C.BAT`, and `E.BAT`
`.MAP` | Linker map file | Shows where code and data landed in the linked image
`.PIF` | Project or debugger configuration file | Seen in regional Zelda DX branches such as `C_USA.PIF`, likely carrying project or debugger session settings
`.CVT` | Conversion script or conversion input | Used with Nintendo conversion tools such as `FCV`
`.X65` | 6502-family assembly source | More common in other Nintendo projects than Game Boy itself, but it appears in the wider leak ecosystem

One of the more useful lessons from the leaked folders is that Nintendo did not keep source, objects, maps, listings, and debugger files neatly separated.
Real project folders often mix them together in the same working directory.

---
## Graphics, Audio, and Data Files
The asset side of the Game Boy workflow is just as revealing as the code side.
The Zelda DX folders are especially useful here because they preserve active art, layout, and map work rather than just final ROMs.
The newer DMG Zelda art folders are helpful too, because they preserve matching `CGX`, `COL`, and `SCR` sets like `end-demo-A.*`, `end-demo-B.*`, and `wak.*` rather than only loose graphics banks.

Extension | What it usually is | What we now know
---|---|---
`.CHR` | Character/tile graphics | Standard 2bpp tile graphics used by the Game Boy family. Files like `C1.CHR` through `C8.CHR` appear repeatedly in both DMG and CGB branches
`.CGX` | Graphics resource file | Much closer to a raw tile bank than older writeups implied. In both DMG and CGB workspaces these hold title graphics, event graphics, room graphics, and UI assets. DMG-targeted folders such as `z-dmg-zelda` show that `.CGX` is not automatically "color graphics": many of those banks are still plain 2bpp Game Boy tile data, just stored under the CAD-style `.CGX` extension rather than `.CHR`
`.HEX` | Plain text or assembler-friendly data blob | In Nintendo Game Boy projects this is often audio-related rather than generic random data. Zelda DX uses `BGM_1.HEX`, `BGM_2.HEX`, `BGM_1F.HEX`, and `SE.HEX` for music and sound effect content
`.BIN` | Raw binary data blob | A generic binary payload. In Zelda DX, folders like `New_sound` contain binary exports such as `bgm_1.bin`, `bgm_2.bin`, and `se.bin`
`.CDT` | Color definition or color-layout data | The Zelda DX `COLOR` and `COLOR2` folders make this much firmer than before. Large banks of `.CDT` files sit beside graphics and map resources, which strongly suggests editor-side color definitions or color-layout tables rather than code
`.COL` | Color or palette-related data | The DMG Zelda art folders make this much less vague than it used to be. Files such as `end-demo-A.COL`, `end-demo-B.COL`, `end-demo-C.COL`, and `wak.COL` sit directly beside matching `.CGX` and `.SCR` files, which supports the idea that `.COL` was the color or palette companion to a specific graphics/layout set rather than a random standalone blob
`.SCR` | Screen or layout resource | Not just a vague "screen file". In Zelda DX these appear as room and menu layout resources such as `ROOM20.SCR`, `ROOM20c.SCR`, `name_1.scr`, and `TEST1.SCR`, while the DMG Zelda art folders preserve same-name `.SCR` companions for files like `end-demo-A`, `end-demo-B`, and `wak`. That makes the broad layering much clearer: `.CGX` stores the tile graphics, `.COL` stores the matching color data when needed, and `.SCR` stores the composed screen or layout side
`.MDT` | Map data file | Seen concretely in Zelda DX as `zel_map1.MDT` and `zel_map2.MDT`, which strongly supports the idea that it is editable map data
`.PDT` | Panel or attribute-related data | Found beside `.PNL` files in `ATR` and `ATR2`, suggesting layout or attribute resources rather than code
`.PNL` | Panel or attribute layout resource | The Zelda DX `ATR2` folders make this much less mysterious than before. These look like editor-produced panel or attribute files used alongside other layout resources

The broad pattern is that Nintendo's Game Boy projects often kept graphics, color definitions, maps, and layout files as their own editable layers rather than baking everything directly into the source code.
The most important refinement now is that the extension alone does not tell you whether a graphics bank is monochrome or color.
A `.CGX` file in a DMG-targeted workspace can still be ordinary 2bpp Game Boy tile data, while the matching `.SCR` and `.COL` files tell you how that bank was actually being laid out or colored inside the editor pipeline.

---
## IS-CGB-CAD data formats
The IS-SUPPORT leak material includes an `IS-CGB-CAD` tool distribution with a small set of internal file formats documented in Japanese as `DCG`, `DSC`, `DOB`, and `DCL`.
These are useful because they spell out the exact bit packing for Game Boy Color tile data, per-tile attributes, and object layout.

The formats line up closely with what the hardware expects on CGB.
They also clarify why the same project can carry both SNES-like CAD extensions (`CGX`, `COL`, `SCR`) and more directly named Game Boy specific blobs in the same workflow.

### DCG format - Tile Data
`DCG` is a tile + attribute + color bundle used by the CAD tool.

Range | Size | Meaning
---|---:|---
0x0000-0x17FF | 0x1800 | Character (tile) data
0x1800-0x197F | 0x0180 | Attributes (palette info in IS-CGB-CAD)
0x1980-0x19FF | 0x0080 | Color data

The character data is classic Game Boy 2bpp tiles: 16 bytes per 8x8 tile, with 2 bytes per row (low bitplane byte then high bitplane byte).

This plays the same role as SNES `CGX` (a raw tile bank), but the packing is different: Game Boy uses 2bpp row pairs, while SNES `CGX` is planar bitplanes (commonly 4bpp).

### DSC format - Screen Data
`DSC` is a background screen map in the same split form that the CGB hardware uses: one byte of tile index per cell and one byte of attributes per cell.

Range | Size | Meaning
---|---:|---
0x0000-0x03FF | 0x0400 | Character code (tile index)
0x0400-0x07FF | 0x0400 | Attribute byte

The attribute byte is documented with this bit layout:

Bits | Meaning
---|---
0-2 | CGB palette index
3 | character bank select
4 | unused (but used inside IS-CGB-CAD)
5 | horizontal flip
6 | vertical flip
7 | priority (0: follow OBJ-side priority, 1: BG highest priority)

This plays the same role as SNES `SCR` (a background tilemap), but the storage model differs: SNES packs tile index and attributes into 16-bit words, while CGB splits the tile index and attributes into separate byte arrays.

### DCL format - Palette data
`DCL` is a small palette block. It stores 2 bytes per color with 5 bits each for R, G, and B.


### DOB format - Object Data
`DOB` is a chunked object and animation container with tagged blocks like `"CGB "`, `"ANIM"`, `"GRP "`, `"SIZE"`, `"LINK"`, `"VER "`, and `"END "`.
Unlike many SNES CAD blobs that are fixed-size record regions, `DOB` is explicitly variable-length and carries its own version and filename link table.

If you are comparing this to the SNES CAD families, `DSC` is closest to `SCR` (BG tilemap), while `DOB` is closer to `OBJ`/`OBX` (object placement plus animation-related data).


---
## ICE and Debugger Support Files
Some of the strangest extensions in the leak make more sense once you look at the debugger workflow rather than the game code alone.

Extension | What it usually is | What we now know
---|---|---
`.ICE` | ICE helper script or opaque debugger-related binary | This extension is overloaded. In the SGB sample, `START.ICE` is a tiny text startup script that tells the debugger what to load. In Zelda DX, files like `RZ.ICE`, `RZ1.ICE`, and `rchr.ICE` look more like binary blobs or packed data tied to the same broader toolchain
`.DAT` | Debugger sidecar data | Files such as `isdwdcmd.dat`, `isdwdrng.dat`, and `isdwdsym.dat` were generated alongside builds and appear to hold debugger command, range, and symbol information
`.ISX` | Debugger image with symbol/debug context | Worth repeating here because it sits at the boundary between ROM output and debugger workflow
`.RAM` | Runtime memory snapshot | Useful for preserving machine state during debugging or test runs

The SGB sample is especially useful because it shows how these pieces fit together.
`C.BAT` assembles and links the sample, `isd` launches the debugger, and `START.ICE` tells it to load `SGB_MAIN` plus the `CHRDAT.COM` graphics bank at the right address.

That is also why the Zelda DX folders are full of `isdwd*.dat` files.
They are part of the debugger-facing side of Nintendo's Intelligent Systems development environment.

{% include_cached link-to-other-post.html post="/zelda-links-awakening-dx" description="To see a real-world production workspace, see the Zelda Link's Awakening DX source archive." %}

---
## Quick Notes on the Toolchain
The file formats only really make sense when viewed as part of the wider Game Boy development flow.

Tool | Role
---|---
`MIFES` | Source editor used in older DOS-era workflows
`ISDMG` | Older assembler used with `.DMG` source modules
`ISLINK` | Linker used in the older DMG workflow
`isas32` | Later assembler used heavily in Color-era branches
`islk32` | Later linker used with the newer assembler flow
`isd` | Debugger front end used with ICE startup scripts and debugger images
