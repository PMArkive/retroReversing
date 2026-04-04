---
layout: post
tags:
- nintendo
- gigaleak
- news
- sfc
- dmg
title: Gigaleak - NEWS_11 Workstation Restore (Hino)
category: nintendo
permalink: /gigaleak-news-11
breadcrumbs:
  - name: Home
    url: /
  - name: Nintendo Leaks
    url: /nintendo-leaks
  - name: NEWS_11
    url: #
recommend:
- snes
- fileformats
editlink: /leaks/Nintendo/GigaleakNEWS11.md
updatedAt: '2026-04-01'
excerpt: A Nintendo workstation home directory snapshot packed with SNES CAD assets, tools, and Nintendo projects.
---

# Gigaleak - NEWS_11 Workstation Restore (Hino)
`NEWS_11` is a restored workstation snapshot centered on a user home directory called `hino`.
It is mostly art and tool data, not game source code.

The high-signal thing it preserves is the workflow split:

* palettes in `COL`
* tiles in `CGX`
* screen composition in `SCR`
* sprite and object layout in `OBJ` and `OBX`
* CAD-side metadata in `SFX`

If you want the decoding details, these two pages cover the formats directly:

{% include link-to-other-post.html post="/snes-file-formats" description="SNES workstation formats: COL, CGX, SCR, OBJ/OBX, SFX, and related tooling." %}
{% include link-to-other-post.html post="/game-boy-file-formats" description="Game Boy workstation formats, including DMG-style 2bpp tile banks in CGX." %}

---
## Root Directory
At the top level, `NEWS_11` is just a tarball and one extracted home tree.

Path | Notes
---|---
`NEWS_11.tar` | the original archived restore
`hino/` | extracted workstation home directory

---
## What Is Inside hino
This restore is large enough that file counts are useful.
Across the full tree there are `3,487` files.

The most common file types are exactly the SNES CAD formats:

Extension | Count
---|---:
`CGX` | `1,281`
`OBJ` | `917`
`SCR` | `873`
`COL` | `781`
`PNL` | `487`
`BAK` | `442`

And the largest project workspaces under `hino/` are:

Folder | Files | Notes
---|---:|---
`yoshi/` | `2,271` | huge SNES art workspace with dense backups
`hati-toru/` | `761` | another large art workspace split into many subfolders
`z-mario-4/` | `704` | SNES Mario project art workspace dominated by SCR/CGX/OBJ/COL
`z-sword/` | `433` | Zelda-like art workspace with MAP and panel resources
`NEW-CHR/` | `245` | panel-heavy `PNL` workspace with many backups
`z-dmg-zelda/` | `73` | DMG-style Zelda art data stored in the same CAD family

---
## Major Workspaces
The top-level layout is flat, but it clusters into a few obvious projects.

{% capture news11_tree %}
- 📁 yoshi | Large SNES art workspace (assets, maps, sprites, backups)
- 📁 z-mario-4 | SNES Mario project art workspace (SCR/CGX/OBJ/COL, small SFX set)
- 📁 z-sword | Zelda-like SNES art workspace (OBJ/CGX/SCR/COL plus MAP and PNL)
- 📁 z-dmg-zelda | DMG Zelda art workspace using CGX/COL/SCR/OBJ with 2bpp banks
- 📁 hati-toru | Large art workspace with many themed subfolders
- 📁 NEW-CHR | Panel work (`PNL`) with extensive backups
- 📁 srd | Tooling and documentation bundle, including CAD binaries and `sfx_main.hex`
- 📁 .CAD_SRD | CAD tool working area
{% endcapture %}
{% include connected-folder-tree.html tree=news11_tree %}

---
## z-dmg-zelda
This folder is small, but it is one of the most interesting.
It preserves DMG-style Zelda art stored in the same workstation container formats as the SNES projects.

The contents are a tight set of:

* `end-demo-*` screen and object assets (`CGX`, `SCR`, `OBJ`, `COL`)
* `wak.*` and `kihon.*` base assets and palettes
* a single `kihon.SFX` metadata sidecar
* rendered `PNG` previews beside some screens

This is also where the `2bpp` vs `4bpp` distinction becomes visible in practice.
Several `SCR` files reference tile ranges that only fit if their paired `CGX` is decoded as `2bpp`.

---
## yoshi
`yoshi/` is the largest subtree by far.
It looks like a long-lived SNES art workspace with real iteration history:

* hundreds of `BAK` backups
* dense `CGX`, `COL`, `SCR`, and `OBJ` banks
* large runs of panel resources (`PNL`) and compressed object banks (`OBZ`)
* many subfolders that read like specific scenes, map variants, or asset groups (`ENDING`, `SPR`, `V-RAM`, `NEW-MAP`, `KOOPA-FINAL`)

This is the folder that best shows how the pipeline worked day-to-day, because it keeps so much intermediate state and backup material.

---
## z-mario-4
This is a high-density SNES art workspace dominated by:

* `SCR` screen composition files
* `CGX` graphics banks
* `OBJ` object and sprite layout
* `COL` palette banks

It also carries a small cluster of `SFX` sidecars.
So it is a good place to study the full `COL + CGX + SCR + OBJ` layer stack for menu-like or UI-heavy assets.

---
## z-sword
`z-sword/` is a strong “everything in one place” art workspace.
Compared with `z-mario-4`, it adds:

* `MAP` resources
* lots of `PNL` panel files
* a more even mix of `OBJ`, `CGX`, `SCR`, and `COL`

It also has stock folders (`BG-stock`, `CHR-stock`, `COL-stock`, `V-RAM`) that look like shared banks or staging areas.

---
## SRD Tools and CAD Support
The `srd/` folder is unusually valuable because it is not a project asset tree.
It looks like a tool and documentation bundle:

* `srd/bin/` includes binaries like `cad`, `cad_chk`, and `obj_tool_chk`
* `srd/cad/sfc/` includes `sfx_main.hex`, `obj_tool.hex`, and related `ADD` files
* `srd/cad/bin/` includes transfer and print utilities like `pr_scr_*`, `pr_col_*`, `pr_obj_*`, `pr_chr_*`
* `srd/doc/` contains tool documentation (`README.doc`, `cad` helpers, `arc`, `taraka`, `sf`, `srd`)

If you are trying to understand how these formats were produced and moved around, this is the most directly “tooling shaped” part of the restore.

### What SRD Probably Means
In this tree, `srd` clearly acts like a shared tools prefix, with references to `/usr/local/srd/bin` and `/usr/local/srd/doc`.
Outside this restore, `SRD` is most commonly expanded as **Systems Research & Development**, the name used by the long-running Nintendo partner company **SRD Co., Ltd.**

So the most useful practical reading here is:

* `srd/` is a shared internal tool bundle
* the tools and docs are installed and managed under `/usr/local/srd`
* the same name aligns with the SRD organization that historically shipped tooling and development support around Nintendo projects

### The Host Machine and Runtime
Several of the core tools are compiled MIPS big-endian executables in ECOFF format:

* `srd/bin/azrael`
* `srd/bin/emln`
* `srd/bin/taraka`
* `srd/bin/lpf_xwdpr801ymc`
* `srd/cad/bin/cad` and the `pr_*` print utilities

That points to an IRIX-era MIPS workstation environment.
The `srd/bin` folder also mixes in small shell scripts that act as wrappers and checks.

### /usr/local/srd As a “Command Registry”
The Japanese `srd/doc/README.doc` describes the intent of `/usr/local/srd/bin`:

* commands registered there are free to use
* if you need to modify one, you copy it into your own directory first
* every command requires a matching `*.doc` description under `/usr/local/srd/doc`
* new commands must be general-purpose, not project-private
* the directory is managed by the superuser

The `srd` command itself is documented as a tool that prints the list of registered commands.
It also notes there were separate CISC and RISC variants with different registered command sets.

### CAD Tool Bundle
The `srd/cad/` subtree is the closest thing to a packaged CAD distribution in `NEWS_11`.
It has three layers:

* `srd/cad/bin/`: the main `cad` binary and a matching set of print utilities
* `srd/cad/options/`: CAD option and helper config files (`sfx_main.OPT`, `obj_tool`, `cad_clear`)
* `srd/cad/sfc/`: Super Famicom-side hex payloads and their `ADD` sidecars

The `srd/cad/bin/readme.doc` file lists the required binaries, and the names line up perfectly with the formats seen elsewhere in `NEWS_11`:

* `pr_chr_*` prints character banks (`CGX`)
* `pr_col_*` prints palettes (`COL`)
* `pr_scr_*` prints screen composition (`SCR`)
* `pr_obj__` prints objects (`OBJ`)
* `pr_obj_Q` prints object sequences (OBJ SEQ)
* `pr_pnl__` prints panels (`PNL`)
* `pr_map__` prints maps (`MAP`)

That is a very direct confirmation that these extensions are not just “game blobs”.
They are first-class CAD layers with dedicated output paths.

### Super Famicom Payloads
The `srd/cad/sfc/` folder includes the tool-side payloads that match the CAD metadata formats:

File | Size | Notes
---|---:|---
`sfx_main.hex` | `130,690` bytes | the main CAD `SFX` support payload
`sfx_main.ADD` | `3,414` bytes | sidecar associated with `sfx_main`
`obj_tool.hex` | `4,680` bytes | object tooling payload
`sfx_clear.hex` | `514` bytes | small helper payload
`color_change.hex` | `331,062` bytes | large color-change payload plus `color_change.ADD`

The important point is not that these are “ROMs”, but that they are tooling-side payloads sitting directly beside the CAD environment.
They help explain why formats like `SFX` exist at all: they are part of a tool pipeline, not a game runtime format.

### Example Tool Docs
Two of the `srd/doc/*.doc` files are especially revealing:

* `arc` is a simple archiver that bundles multiple files into one and compresses them
* `azrael` edits `MAP` files and checks overlap and bank overflow across multiple map inputs, marking issues per-line and returning status `1` on failure

Those descriptions line up neatly with the rest of the restore:
`NEWS_11` is full of intermediate CAD assets, and `srd/` preserves the “plumbing” used to validate, print, transfer, and manage them.
