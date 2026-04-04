import { useEffect, useMemo, useRef, useState } from 'react';
import FileUpload from './FileUpload';

type BitDepth = 2 | 4 | 8;
type PaletteMode = 'attr' | 'manual';
type GroupMode = 'frame4' | 'frame8' | 'frame16' | 'frame32' | 'frame64' | 'frame128';
type ObjFormat = 'obj' | 'obj10' | 'obz';
type SizeOverride = 'auto' | 'small' | 'large';
type SizePreviewMode = 'normal' | 'compare';
type ObjFormatOverride = 'auto' | 'obj' | 'obj10' | 'obz';
type FlipOverride = 'auto' | 'off' | 'on';

interface PaletteColor {
  value: number;
  hex: string;
  rgbHex: string;
}

interface ParsedCol {
  rows: PaletteColor[][];
}

interface ParsedCgx {
  tileCount: number;
  bytesPerTile: number;
  tiles: Uint8Array[];
  pixels: Uint8Array;
  warnings: string[];
}

interface ObjRecord {
  byte1: number;
  groupInfo: number;
  display: boolean;
  largeTile: boolean;
  rawXY: number;
  xByte: number;
  yByte: number;
  xSigned: number;
  ySigned: number;
  tileIndex: number;
  tileId: number;
  attr: number;
}

interface ParsedObj {
  format: ObjFormat;
  byteLength: number;
  recordRegionBytes: number;
  metadataTailBytes: number;
  recordCount: number;
  displayedCount: number;
  records: ObjRecord[];
  sequences: ObjSequence[];
  suggestedGroupMode: GroupMode;
  byte1Values: number[];
  groupInfoValues: number[];
  attrs: number[];
  obzTerminatedFrames: number;
  obzBabyMarkers: number;
  obzEggMarkers: number;
  warnings: string[];
}

interface ObjSequenceStep {
  duration: number;
  frame: number;
}

interface ObjSequence {
  index: number;
  steps: ObjSequenceStep[];
  rawBytes: Uint8Array;
}

interface ObjGroup {
  label: string;
  records: ObjRecord[];
}

interface ObjCluster {
  label: string;
  records: ObjRecord[];
}

const OBJECT_SIZE_SETTINGS = {
  0: { label: '8x8 and 16x16', small: [8, 8], large: [16, 16] },
  1: { label: '8x8 and 32x32', small: [8, 8], large: [32, 32] },
  2: { label: '8x8 and 64x64', small: [8, 8], large: [64, 64] },
  3: { label: '16x16 and 32x32', small: [16, 16], large: [32, 32] },
  4: { label: '16x16 and 64x64', small: [16, 16], large: [64, 64] },
  5: { label: '32x32 and 64x64', small: [32, 32], large: [64, 64] },
  6: { label: '16x32 and 32x64', small: [16, 32], large: [32, 64] },
  7: { label: '16x32 and 32x32', small: [16, 32], large: [32, 32] },
} as const;

function bytesPerTile(bitDepth: BitDepth): number {
  if (bitDepth === 2) return 16;
  if (bitDepth === 4) return 32;
  return 64;
}

function signedByte(value: number): number {
  return value >= 0x80 ? value - 0x100 : value;
}

function scale5Bit(value: number): number {
  return (value << 3) | (value >> 2);
}

function decodePaletteColor(value: number): PaletteColor {
  const red = scale5Bit(value & 0x1f);
  const green = scale5Bit((value >> 5) & 0x1f);
  const blue = scale5Bit((value >> 10) & 0x1f);

  return {
    value,
    hex: value.toString(16).toUpperCase().padStart(4, '0'),
    rgbHex: `#${red.toString(16).padStart(2, '0')}${green
      .toString(16)
      .padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`,
  };
}

function parseCol(buffer: Uint8Array): ParsedCol | null {
  if (buffer.length < 2) return null;

  let source = buffer;
  if (buffer.length > 0x200 && buffer.length % 0x1000 === 0x200) {
    source = buffer.slice(0, buffer.length - 0x200);
  }

  const colors: PaletteColor[] = [];
  for (let offset = 0; offset + 1 < source.length; offset += 2) {
    const value = source[offset] | (source[offset + 1] << 8);
    colors.push(decodePaletteColor(value));
  }

  const rows: PaletteColor[][] = [];
  for (let i = 0; i < colors.length; i += 16) {
    rows.push(colors.slice(i, i + 16));
  }

  return { rows };
}

function parseCgx(buffer: Uint8Array, bitDepth: BitDepth): ParsedCgx {
  let source = buffer;
  const tileSize = bytesPerTile(bitDepth);
  const warnings: string[] = [];
  if (buffer.length > 0x500 && buffer.length % 0x1000 === 0x500) {
    source = buffer.slice(0, buffer.length - 0x500);
    warnings.push('Trimmed the standard 0x500-byte CAD tail from the CGX file before decoding.');
  }

  const remainder = source.length % tileSize;

  if (remainder !== 0) {
    warnings.push(
      `${remainder} trailing bytes do not fit the selected ${bitDepth}bpp tile size and were ignored.`,
    );
  }

  const tileCount = Math.floor(source.length / tileSize);
  const tiles: Uint8Array[] = [];
  const pixels = new Uint8Array(tileCount * 64);
  for (let i = 0; i < tileCount; i += 1) {
    const start = i * tileSize;
    const tile = source.slice(start, start + tileSize);
    tiles.push(tile);
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        pixels[i * 64 + y * 8 + x] = decodePixel(tile, bitDepth, x, y);
      }
    }
  }

  return {
    tileCount,
    bytesPerTile: tileSize,
    tiles,
    pixels,
    warnings,
  };
}

function parseObj(
  buffer: Uint8Array,
  fileName?: string | null,
  override: ObjFormatOverride = 'auto',
): ParsedObj | null {
  if (buffer.length < 6) return null;

  const warnings: string[] = [];
  const obzWarnings: string[] = [];
  const cut = buffer.length & 0x0fff;
  const marker = new TextDecoder().decode(buffer).indexOf('NAK1989');
  let recordRegionBytes = buffer.length;
  let format: ObjFormat = 'obj';
  let obzTerminatedFrames = 0;
  let obzBabyMarkers = 0;
  let obzEggMarkers = 0;

  const obzHint = Boolean(fileName && /\.obz$/i.test(fileName));
  const obj10Hint = Boolean(fileName && /\.obj10$/i.test(fileName));

  if (override !== 'auto') {
    format = override;
    if (format === 'obz') {
      recordRegionBytes = Math.min(buffer.length, 0x6000);
      if (buffer.length < 0x6000) {
        obzWarnings.push(
          `Forced OBZ mode but file is shorter than 0x6000 bytes (got ${formatHex(buffer.length, 4)}).`,
        );
      }
    } else if (marker >= 0) {
      recordRegionBytes = marker;
      warnings.push(
        `Detected CAD metadata tail at byte ${recordRegionBytes}. Only the front record region is rendered.`,
      );
    }
  } else if (obj10Hint) {
    format = 'obj10';
  } else if (obzHint && buffer.length >= 0x6000) {
    format = 'obz';
    recordRegionBytes = 0x6000;
    if (buffer.length !== 0x6a00) {
      obzWarnings.push(
        `Detected .OBZ extension. Rendering only the front 0x6000-byte record region (file length is ${formatHex(buffer.length, 4)}).`,
      );
    }
  } else if (buffer.length === 0x6a00) {
    format = 'obz';
    recordRegionBytes = 0x6000;
    obzWarnings.push('Detected OBZ container size 0x6A00. Rendering only the front 0x6000-byte record region.');
  } else if (buffer.length === 0xa000) {
    format = 'obj10';
    recordRegionBytes = 0xa000;
    warnings.push('Detected 0xA000-byte printer/report OBJ region (10-byte entries, 64x64).');
  } else if (cut === 0x500 || cut === 0x900) {
    recordRegionBytes = buffer.length - cut;
  } else if (marker >= 0) {
    recordRegionBytes = marker;
  }

  if (format === 'obj10') {
    recordRegionBytes -= recordRegionBytes % 10;
  } else {
    recordRegionBytes -= recordRegionBytes % 6;
  }
  const metadataTailBytes = buffer.length - recordRegionBytes;

  if (marker >= 0) {
    warnings.push(
      `Detected CAD metadata tail at byte ${recordRegionBytes}. Only the front record region is rendered.`,
    );
  } else if (buffer.length % 6 !== 0) {
    warnings.push('File length is not a multiple of 6. Trailing bytes were ignored.');
  }

  const records: ObjRecord[] = [];
  if (format === 'obz') {
    if (recordRegionBytes < 0x6000) {
      warnings.push(
        `OBZ record region is shorter than expected (got ${recordRegionBytes} bytes, expected 0x6000). Some frames may be missing.`,
      );
    }

    const totalFrames = Math.floor(Math.min(recordRegionBytes, 0x6000) / 0x180);
    for (let frame = 0; frame < totalFrames; frame += 1) {
      const frameStart = frame * 0x180;
      const frameRecords: ObjRecord[] = [];
      let hasTerminator = false;
      let shownNonSpecial = 0;

      for (let slot = 0; slot < 64; slot += 1) {
        const offset = frameStart + slot * 6;
        if (offset + 5 >= recordRegionBytes) break;
        const byte0 = buffer[offset];
        const tileLow = buffer[offset + 1];
        const xByte = buffer[offset + 2];
        const yByte = buffer[offset + 3];
        const attr = buffer[offset + 4];
        const groupInfo = buffer[offset + 5];
        const tile12 = ((byte0 & 0x0f) << 8) | tileLow;
        const display = (byte0 & 0x80) !== 0;

        if (display) {
          if (tile12 === 0x24a) {
            hasTerminator = true;
          } else if (tile12 === 0x22e) {
            obzBabyMarkers += 1;
          } else if (tile12 === 0x24e) {
            obzEggMarkers += 1;
          } else {
            shownNonSpecial += 1;
          }
        }

        frameRecords.push({
          byte1: byte0,
          groupInfo,
          display,
          largeTile: (byte0 & 0x40) !== 0,
          rawXY: yByte | (xByte << 8),
          xByte,
          yByte,
          xSigned: signedByte(xByte),
          ySigned: signedByte(yByte),
          tileIndex: tileLow,
          tileId: tile12,
          attr,
        });
      }

      if (hasTerminator) {
        obzTerminatedFrames += 1;
        records.push(
          ...frameRecords.map(() => ({
            byte1: 0,
            groupInfo: 0,
            display: false,
            largeTile: false,
            rawXY: 0,
            xByte: 0,
            yByte: 0,
            xSigned: 0,
            ySigned: 0,
            tileIndex: 0,
            tileId: 0,
            attr: 0,
          })),
        );
        continue;
      }

      if (shownNonSpecial > 6) {
        obzWarnings.push(
          `Frame ${frame + 1} contains ${shownNonSpecial} displayed non-special entries; the Yoshi conversion tool expects at most 6.`,
        );
      }

      records.push(...frameRecords);
    }
  } else {
    if (format === 'obj10') {
      // Printer/report OBJ layout (pr_obj__): 64 frames x 64 entries, 10 bytes per entry.
      // Offset map (only fields pr_obj__ actually uses):
      //   0 flags (bit7 display, bit0 size)
      //   1 flip selector (0..3) behaving like HV flip bits
      //   2 unknown (printed)
      //   3 palette/attr nibble (used as value<<4)
      //   5 Y signed, 6 X signed
      //   8..9 tile/char id (16-bit)
      for (let offset = 0; offset + 9 < recordRegionBytes; offset += 10) {
        const flags = buffer[offset];
        const flipSel = buffer[offset + 1];
        const groupInfo = buffer[offset + 2];
        const attr = buffer[offset + 3];
        const yByte = buffer[offset + 5];
        const xByte = buffer[offset + 6];
        const tileIndex = buffer[offset + 9];
        const tileId = buffer[offset + 8] | (buffer[offset + 9] << 8);
        records.push({
          byte1: flags,
          groupInfo,
          display: (flags & 0x80) !== 0,
          largeTile: (flags & 0x01) !== 0,
          rawXY: yByte | (xByte << 8),
          xByte,
          yByte,
          xSigned: signedByte(xByte),
          ySigned: signedByte(yByte),
          tileIndex,
          tileId,
          // Store the palette/attribute nibble in `attr` so existing UI can surface it.
          // Note: pr_obj__ treats this as a nibble and shifts it left by 4 for its printer routines.
          attr,
        });
      }
    } else {
      for (let offset = 0; offset + 5 < recordRegionBytes; offset += 6) {
        const byte1 = buffer[offset];
        const groupInfo = buffer[offset + 1];
        const rawXY = buffer[offset + 2] | (buffer[offset + 3] << 8);
        const packed = buffer[offset + 4] | (buffer[offset + 5] << 8);
        const xByte = (rawXY >> 8) & 0xff;
        const yByte = rawXY & 0xff;
        const tileIndex = (packed >> 8) & 0xff;
        const attr = packed & 0xff;
        // For CAD OBJ/OBX files, byte 6 is the tile number and byte 5 is a SNES-style attribute byte.
        // Bit 0 is commonly used as a tile-page/name-select bit, effectively making the tile id 9-bit.
        const tileId = ((attr & 0x01) << 8) | tileIndex;
        const sawLegacySize = (byte1 & 0x40) !== 0;
        const largeTile = (byte1 & 0x01) !== 0 || sawLegacySize;
        if (sawLegacySize && (byte1 & 0x01) === 0) {
          warnings.push(
            'Found OBJ/OBX entries with flag bit 0x40 set. This viewer treats bit 0 as size select by default and also accepts bit 0x40 as a legacy size flag.',
          );
        }
        records.push({
          byte1,
          groupInfo,
          display: (byte1 & 0x80) !== 0,
          largeTile,
          rawXY,
          xByte,
          yByte,
          xSigned: signedByte(xByte),
          ySigned: signedByte(yByte),
          tileIndex,
          tileId,
          attr,
        });
      }
    }
  }

  const meaningfulRecords = records.filter(
    (record) =>
      !(
        record.byte1 === 0 &&
        record.groupInfo === 0 &&
        record.rawXY === 0 &&
        record.tileId === 0 &&
        record.attr === 0
      ),
  );
  const displayedRecords = meaningfulRecords.filter((record) => record.display);

  const sequences = parseObjSequences(buffer, format, recordRegionBytes);

  // Heuristic: some CAD OBJ files appear to pack two 32-entry "subframes" into each 64-entry block.
  // If many 64-entry blocks have shown sprites in both halves, 32-entry frames are easier to inspect.
  let suggestedGroupMode: GroupMode =
    format === 'obz'
      ? 'frame64'
      : format === 'obj10'
        ? 'frame64'
        : recordRegionBytes >= 24576
          ? 'frame128'
          : 'frame64';
  if (format === 'obj' && recordRegionBytes >= 64 * 6) {
    const frames64 = Math.floor(recordRegionBytes / (64 * 6));
    let bothHalves = 0;
    for (let frame = 0; frame < frames64; frame += 1) {
      let firstHalf = 0;
      let secondHalf = 0;
      for (let slot = 0; slot < 64; slot += 1) {
        const record = records[frame * 64 + slot];
        if (!record || !record.display) continue;
        if (slot < 32) firstHalf += 1;
        else secondHalf += 1;
      }
      if (firstHalf > 0 && secondHalf > 0) bothHalves += 1;
    }

    if (frames64 > 0 && bothHalves / frames64 >= 0.5) {
      suggestedGroupMode = 'frame32';
      warnings.push(
        `This OBJ has ${bothHalves} 64-entry blocks with sprites in both halves. Try 32-entry chunks if parts look like two poses overlaid.`,
      );
    }
  }

  return {
    format,
    byteLength: buffer.length,
    recordRegionBytes,
    metadataTailBytes,
    recordCount: records.length,
    displayedCount: displayedRecords.length,
    records,
    sequences,
    suggestedGroupMode,
    byte1Values: [...new Set(meaningfulRecords.map((record) => record.byte1))].sort((a, b) => a - b),
    groupInfoValues: [...new Set(meaningfulRecords.map((record) => record.groupInfo))].sort((a, b) => a - b),
    attrs: [...new Set(meaningfulRecords.map((record) => record.attr))].sort((a, b) => a - b),
    obzTerminatedFrames,
    obzBabyMarkers,
    obzEggMarkers,
    warnings: [...warnings, ...obzWarnings],
  };
}

function parseObjSequences(buffer: Uint8Array, format: ObjFormat, recordRegionBytes: number): ObjSequence[] {
  // Known sequence format used by CAD-side object containers:
  // each sequence is 0x20 bytes, storing up to 16 pairs of (duration, frame).
  // sequence ends at the first 0x00 0x00 pair.
  //
  // Common locations:
  // - OBJ/OBX with a trailing CAD tail: recordRegionBytes + 0x100 (often 0x3100 for OBJ, 0xC100 for OBX-like)
  // - OBZ: 0x6000 (tail region start)
  const sequences: ObjSequence[] = [];

  const fallbackBase = format === 'obz' ? 0x6000 : recordRegionBytes + 0x100;

  const sequenceCount = 0x10;
  const sequenceBytes = format === 'obj10' ? 0x80 : 0x20;

  function parseAt(base: number): ObjSequence[] {
    if (base < 0 || base + sequenceCount * sequenceBytes > buffer.length) return [];
    const out: ObjSequence[] = [];
    for (let seq = 0; seq < sequenceCount; seq += 1) {
      const start = base + seq * sequenceBytes;
      const raw = buffer.slice(start, start + sequenceBytes);
      const steps: ObjSequenceStep[] = [];
      const maxSteps = format === 'obj10' ? 0x40 : 0x10;
      for (let i = 0; i < maxSteps; i += 1) {
        const duration = raw[i * 2];
        const frame = raw[i * 2 + 1];
        if (duration === 0 && frame === 0) break;
        steps.push({ duration, frame });
      }
      if (steps.length > 0) out.push({ index: seq, steps, rawBytes: raw });
    }
    return out;
  }

  // Some CAD tails place a small header before the sequence table.
  // Heuristic: scan a short window for the first plausible sequence block.
  function findSequenceBaseInWindow(windowStart: number, windowBytes: number): number | null {
    const start = Math.max(0, windowStart);
    const end = Math.min(buffer.length - sequenceCount * sequenceBytes, start + windowBytes);
    const maxFrames = format === 'obz' ? 64 : (recordRegionBytes >= 0xc000 ? 64 : 32);

    for (let candidate = start; candidate <= end; candidate += 0x10) {
      // Candidate is plausible if:
      // - the first pair is not 0x00 0x00
      // - frames are within range
      // - durations are not all 0xFF (common sentinel/header)
      const raw = buffer.slice(candidate, candidate + sequenceBytes);
      if (raw.length < sequenceBytes) break;
      const d0 = raw[0];
      const f0 = raw[1];
      if (d0 === 0 && f0 === 0) continue;

      let nonZeroPairs = 0;
      let plausiblePairs = 0;
      let ffDurations = 0;
      for (let i = 0; i < 0x10; i += 1) {
        const d = raw[i * 2];
        const f = raw[i * 2 + 1];
        if (d === 0 && f === 0) break;
        nonZeroPairs += 1;
        if (d === 0xff) ffDurations += 1;
        if (f < maxFrames) plausiblePairs += 1;
      }

      if (nonZeroPairs === 0) continue;
      if (ffDurations === nonZeroPairs) continue;
      if (plausiblePairs / nonZeroPairs < 0.8) continue;

      return candidate;
    }

    return null;
  }

  const base =
    format === 'obz'
      ? fallbackBase
      : format === 'obj10'
        ? recordRegionBytes
        : (findSequenceBaseInWindow(fallbackBase, 0x200) ?? fallbackBase);

  if (base + sequenceCount * sequenceBytes > buffer.length) {
    return sequences;
  }

  return parseAt(base);
}

function decodePixel(tile: Uint8Array, bitDepth: BitDepth, x: number, y: number): number {
  const shift = 7 - x;
  const p0 = (tile[y * 2] >> shift) & 1;
  const p1 = (tile[y * 2 + 1] >> shift) & 1;

  if (bitDepth === 2) {
    return p0 | (p1 << 1);
  }

  const p2 = (tile[16 + y * 2] >> shift) & 1;
  const p3 = (tile[16 + y * 2 + 1] >> shift) & 1;

  if (bitDepth === 4) {
    return p0 | (p1 << 1) | (p2 << 2) | (p3 << 3);
  }

  const p4 = (tile[32 + y * 2] >> shift) & 1;
  const p5 = (tile[32 + y * 2 + 1] >> shift) & 1;
  const p6 = (tile[48 + y * 2] >> shift) & 1;
  const p7 = (tile[48 + y * 2 + 1] >> shift) & 1;

  return p0 | (p1 << 1) | (p2 << 2) | (p3 << 3) | (p4 << 4) | (p5 << 5) | (p6 << 6) | (p7 << 7);
}

function getGrayscaleColor(index: number, bitDepth: BitDepth): [number, number, number] {
  const max = (1 << bitDepth) - 1;
  const shade = max === 0 ? 0 : Math.round((index / max) * 255);
  return [shade, shade, shade];
}

function getPaletteRgb(
  palette: ParsedCol | null,
  paletteIndex: number,
  bitDepth: BitDepth,
): [number, number, number] {
  if (!palette) {
    return getGrayscaleColor(paletteIndex, bitDepth);
  }

  const flat = palette.rows.flat();
  const picked = flat[paletteIndex];
  if (!picked) return getGrayscaleColor(paletteIndex, bitDepth);

  return [
    parseInt(picked.rgbHex.slice(1, 3), 16),
    parseInt(picked.rgbHex.slice(3, 5), 16),
    parseInt(picked.rgbHex.slice(5, 7), 16),
  ];
}

function getAttrPaletteRow(attr: number): number {
  return (attr >> 1) & 0x07;
}

function getObjectDimensions(mode: number, largeTile: boolean): [number, number] {
  const setting = OBJECT_SIZE_SETTINGS[mode as keyof typeof OBJECT_SIZE_SETTINGS] || OBJECT_SIZE_SETTINGS[0];
  return largeTile ? [...setting.large] as [number, number] : [...setting.small] as [number, number];
}

function drawObjects(
  canvas: HTMLCanvasElement,
  records: ObjRecord[],
  parsedCgx: ParsedCgx | null,
  parsedCol: ParsedCol | null,
  bitDepth: BitDepth,
  scale: number,
  paletteMode: PaletteMode,
  manualPaletteRow: number,
  objectSizeMode: number,
  sizeOverride: SizeOverride,
  objTilesPerRow: number,
  vramOffset: number,
  cgramOffset: number,
  objFormat: ObjFormat,
  hFlipOverride: FlipOverride,
  vFlipOverride: FlipOverride,
) {
  const margin = 8;
  const visibleRecords = records.filter((record) => record.display);
  if (visibleRecords.length === 0) {
    canvas.width = 64;
    canvas.height = 32;
    canvas.style.width = `${64 * scale}px`;
    canvas.style.height = `${32 * scale}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 64, 32);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 64, 32);
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText('No displayed records', 6, 18);
    return;
  }

  const xs = visibleRecords.map((record) => record.xSigned);
  const ys = visibleRecords.map((record) => record.ySigned);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(
    ...visibleRecords.map((record) => {
      const largeTile = sizeOverride === 'auto' ? record.largeTile : sizeOverride === 'large';
      return record.xSigned + getObjectDimensions(objectSizeMode, largeTile)[0] - 1;
    }),
  );
  const maxY = Math.max(
    ...visibleRecords.map((record) => {
      const largeTile = sizeOverride === 'auto' ? record.largeTile : sizeOverride === 'large';
      return record.ySigned + getObjectDimensions(objectSizeMode, largeTile)[1] - 1;
    }),
  );
  const width = maxX - minX + 1 + margin * 2;
  const height = maxY - minY + 1 + margin * 2;

  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width * scale}px`;
  canvas.style.height = `${height * scale}px`;
  canvas.style.imageRendering = 'pixelated';

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const image = ctx.createImageData(width, height);
  const imageData = image.data;

  for (const record of [...visibleRecords].reverse()) {
    const startX = record.xSigned - minX + margin;
    const startY = record.ySigned - minY + margin;
    const autoHFlip = objFormat === 'obj10' ? (record.byte1 & 0x01) !== 0 : (record.attr & 0x40) !== 0;
    const autoVFlip = objFormat === 'obj10' ? (record.byte1 & 0x02) !== 0 : (record.attr & 0x80) !== 0;
    const hFlip = hFlipOverride === 'auto' ? autoHFlip : hFlipOverride === 'on';
    const vFlip = vFlipOverride === 'auto' ? autoVFlip : vFlipOverride === 'on';
    const paletteRow = paletteMode === 'attr' ? getAttrPaletteRow(record.attr) : manualPaletteRow;
    const largeTile = sizeOverride === 'auto' ? record.largeTile : sizeOverride === 'large';
    const [objectWidth, objectHeight] = getObjectDimensions(objectSizeMode, largeTile);
    // VRAM offset is entered in SNES VRAM words (16-bit). Convert that to a tile offset, then to pixels.
    // parsedCgx.pixels is indexed in 8x8 tile pixels (tileIndex * 64).
    const vramBytes = vramOffset * 2;
    const vramTileOffset = parsedCgx ? Math.floor(vramBytes / parsedCgx.bytesPerTile) : 0;
    const tileBase = (vramTileOffset + record.tileId) * 64;

    for (let py = 0; py < objectHeight; py += 1) {
      for (let px = 0; px < objectWidth; px += 1) {
        const outX = startX + px;
        const outY = startY + py;
        if (outX < 0 || outY < 0 || outX >= width || outY >= height) continue;

        let red = 0;
        let green = 0;
        let blue = 0;
        let alpha = 255;

        if (parsedCgx) {
          const sourceX = hFlip ? objectWidth - 1 - px : px;
          const sourceY = vFlip ? objectHeight - 1 - py : py;
          // parsedCgx.pixels is a linear array of 8x8 tiles (tileIndex * 64).
          // For SNES OBJ rendering, the tile number is an index into OBJ VRAM arranged in 16 tiles per row.
          // So the next tile row is +16 in tile index, not +tilesAcross.
          const tilesPerRow = Math.max(1, objTilesPerRow | 0);
          const tileInSpriteX = sourceX >> 3;
          const tileInSpriteY = sourceY >> 3;
          const tileIndex = vramTileOffset + record.tileId + tileInSpriteX + tileInSpriteY * tilesPerRow;
          const pixelOffset = tileIndex * 64 + (sourceY & 0x7) * 8 + (sourceX & 0x7);
          const colorIndex = parsedCgx.pixels[pixelOffset] ?? 0;
          if (colorIndex === 0) {
            alpha = 0;
          } else {
            const paletteIndex =
              bitDepth === 8
                ? cgramOffset + colorIndex
                : cgramOffset + paletteRow * 16 + colorIndex;
            [red, green, blue] = getPaletteRgb(parsedCol, paletteIndex, bitDepth);
          }
        } else {
          const base = (record.tileId + px + py) & ((1 << Math.min(bitDepth, 4)) - 1);
          [red, green, blue] = getGrayscaleColor(base, Math.min(bitDepth, 4) as BitDepth);
        }

        const outputIndex = (outY * width + outX) * 4;
        imageData[outputIndex] = red;
        imageData[outputIndex + 1] = green;
        imageData[outputIndex + 2] = blue;
        imageData[outputIndex + 3] = alpha;
      }
    }
  }

  ctx.putImageData(image, 0, 0);
}

function formatHex(value: number, width = 2): string {
  return `0x${value.toString(16).toUpperCase().padStart(width, '0')}`;
}

function buildGroups(records: ObjRecord[], mode: GroupMode): ObjGroup[] {
  const frameSize =
    mode === 'frame4'
      ? 4
      : mode === 'frame8'
      ? 8
      : mode === 'frame16'
        ? 16
        : mode === 'frame32'
          ? 32
          : mode === 'frame64'
            ? 64
            : 128;
  const groups: ObjGroup[] = [];
  for (let i = 0; i < records.length; i += frameSize) {
    const frameRecords = records.slice(i, i + frameSize);
    if (frameRecords.length > 0) {
      const shown = frameRecords.filter((record) => record.display).length;
      groups.push({
        label: `${frameSize}-entry chunk ${Math.floor(i / frameSize) + 1} (${shown} shown)`,
        records: frameRecords,
      });
    }
  }
  return groups;
}

function buildClusters(records: ObjRecord[], objectSizeMode: number): ObjCluster[] {
  const shown = records.filter((record) => record.display);
  if (shown.length <= 1) return [{ label: `All (${shown.length})`, records: shown }];

  // Simple proximity clustering: sprites that are "nearby" are considered part of the same logical object.
  // This helps for CAD frames that pack multiple independent pieces into one frame block.
  const threshold = 32; // pixels
  const nodes = shown.map((record, index) => {
    const [w, h] = getObjectDimensions(objectSizeMode, record.largeTile);
    return {
      index,
      record,
      cx: record.xSigned + w / 2,
      cy: record.ySigned + h / 2,
    };
  });

  const visited = new Array(nodes.length).fill(false);
  const clusters: ObjCluster[] = [];

  for (let i = 0; i < nodes.length; i += 1) {
    if (visited[i]) continue;
    const queue = [i];
    visited[i] = true;
    const cluster: ObjRecord[] = [];
    while (queue.length) {
      const current = queue.pop() as number;
      cluster.push(nodes[current].record);
      for (let j = 0; j < nodes.length; j += 1) {
        if (visited[j]) continue;
        const dx = Math.abs(nodes[current].cx - nodes[j].cx);
        const dy = Math.abs(nodes[current].cy - nodes[j].cy);
        if (dx <= threshold && dy <= threshold) {
          visited[j] = true;
          queue.push(j);
        }
      }
    }
    clusters.push({ label: '', records: cluster });
  }

  clusters.sort((a, b) => b.records.length - a.records.length);
  return [
    { label: `All (${shown.length})`, records: shown },
    ...clusters.map((cluster, index) => ({
      label: `Cluster ${index + 1} (${cluster.records.length})`,
      records: cluster.records,
    })),
  ];
}

function SnesObjViewer() {
  const [objBuffer, setObjBuffer] = useState<Uint8Array | null>(null);
  const [cgxBuffer, setCgxBuffer] = useState<Uint8Array | null>(null);
  const [colBuffer, setColBuffer] = useState<Uint8Array | null>(null);
  const [objName, setObjName] = useState('object-layout');
  const [objFileName, setObjFileName] = useState<string | null>(null);
  const [objFormatOverride, setObjFormatOverride] = useState<ObjFormatOverride>('auto');
  const [sequenceIndex, setSequenceIndex] = useState<number | null>(null);
  const [sequenceStepIndex, setSequenceStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bitDepth, setBitDepth] = useState<BitDepth>(4);
  const [scale, setScale] = useState(3);
  const [paletteMode, setPaletteMode] = useState<PaletteMode>('attr');
  const [manualPaletteRow, setManualPaletteRow] = useState(0);
  const [groupMode, setGroupMode] = useState<GroupMode>('frame64');
  const [groupIndex, setGroupIndex] = useState(0);
  const [clusterIndex, setClusterIndex] = useState(0);
  const [objectSizeMode, setObjectSizeMode] = useState(0);
  const [sizePreviewMode, setSizePreviewMode] = useState<SizePreviewMode>('normal');
  const [sizeOverride, setSizeOverride] = useState<SizeOverride>('auto');
  const [objTilesPerRow, setObjTilesPerRow] = useState(16);
  const [hFlipOverride, setHFlipOverride] = useState<FlipOverride>('auto');
  const [vFlipOverride, setVFlipOverride] = useState<FlipOverride>('auto');
  const [vramOffset, setVramOffset] = useState(0);
  const [cgramOffset, setCgramOffset] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compareSmallRef = useRef<HTMLCanvasElement | null>(null);
  const compareLargeRef = useRef<HTMLCanvasElement | null>(null);

  const parsedObj = useMemo(
    () => (objBuffer ? parseObj(objBuffer, objFileName, objFormatOverride) : null),
    [objBuffer, objFileName, objFormatOverride],
  );
  const parsedCgx = useMemo(() => (cgxBuffer ? parseCgx(cgxBuffer, bitDepth) : null), [cgxBuffer, bitDepth]);
  const parsedCol = useMemo(() => (colBuffer ? parseCol(colBuffer) : null), [colBuffer]);

  useEffect(() => {
    if (!parsedObj) return;
    setGroupMode(parsedObj.suggestedGroupMode);
  }, [parsedObj]);

  useEffect(() => {
    // Avoid confusing "sticky" state when switching between unrelated OBJ files.
    setObjectSizeMode(0);
    setVramOffset(0);
    setCgramOffset(0);
    setPaletteMode('attr');
    setManualPaletteRow(0);
    setSizePreviewMode('normal');
    setSizeOverride('auto');
    setObjTilesPerRow(16);
    setHFlipOverride('auto');
    setVFlipOverride('auto');
  }, [objBuffer]);

  useEffect(() => {
    if (!objBuffer) {
      setObjFormatOverride('auto');
    }
  }, [objBuffer]);

  const groups = useMemo(() => buildGroups(parsedObj?.records || [], groupMode), [parsedObj, groupMode]);
  const frameRecords = useMemo(() => {
    if (groups.length === 0) return [];
    const safeIndex = Math.max(0, Math.min(groupIndex, groups.length - 1));
    return groups[safeIndex]?.records ?? [];
  }, [groups, groupIndex]);

  const clusters = useMemo(() => buildClusters(frameRecords, objectSizeMode), [frameRecords, objectSizeMode]);
  const visibleRecords = useMemo(() => {
    if (clusters.length === 0) return [];
    const safeCluster = Math.max(0, Math.min(clusterIndex, clusters.length - 1));
    return clusters[safeCluster]?.records ?? [];
  }, [clusters, clusterIndex]);

  useEffect(() => {
    setGroupIndex(0);
    setSequenceIndex(null);
    setSequenceStepIndex(0);
    setIsPlaying(false);
    setClusterIndex(0);
  }, [objBuffer, groupMode]);

  const selectedSequence = useMemo(() => {
    if (!parsedObj) return null;
    if (sequenceIndex === null) return null;
    return parsedObj.sequences.find((seq) => seq.index === sequenceIndex) ?? null;
  }, [parsedObj, sequenceIndex]);

  useEffect(() => {
    setSequenceStepIndex(0);
  }, [sequenceIndex]);

  useEffect(() => {
    if (!isPlaying) return;
    if (!selectedSequence) return;
    if (selectedSequence.steps.length === 0) return;
    if (groups.length <= 1) return;

    const safeStepIndex = Math.max(0, Math.min(sequenceStepIndex, selectedSequence.steps.length - 1));
    const step = selectedSequence.steps[safeStepIndex];
    const durationMs = Math.max(1, step.duration) * 16;

    setGroupIndex(Math.max(0, Math.min(groups.length - 1, step.frame)));

    const timer = window.setTimeout(() => {
      setSequenceStepIndex((current) => {
        const next = current + 1;
        if (next >= selectedSequence.steps.length) return 0;
        return next;
      });
    }, durationMs);

    return () => window.clearTimeout(timer);
  }, [groups.length, isPlaying, selectedSequence, sequenceStepIndex]);

  useEffect(() => {
    if (!parsedObj) return;

    if (sizePreviewMode === 'compare') {
      if (compareSmallRef.current) {
        drawObjects(
          compareSmallRef.current,
          visibleRecords,
          parsedCgx,
          parsedCol,
          bitDepth,
          scale,
          paletteMode,
          manualPaletteRow,
          objectSizeMode,
          'small',
          objTilesPerRow,
          vramOffset,
          cgramOffset,
          parsedObj.format,
          hFlipOverride,
          vFlipOverride,
        );
      }
      if (compareLargeRef.current) {
        drawObjects(
          compareLargeRef.current,
          visibleRecords,
          parsedCgx,
          parsedCol,
          bitDepth,
          scale,
          paletteMode,
          manualPaletteRow,
          objectSizeMode,
          'large',
          objTilesPerRow,
          vramOffset,
          cgramOffset,
          parsedObj.format,
          hFlipOverride,
          vFlipOverride,
        );
      }
      return;
    }

    if (!canvasRef.current) return;
    drawObjects(
      canvasRef.current,
      visibleRecords,
      parsedCgx,
      parsedCol,
      bitDepth,
      scale,
      paletteMode,
      manualPaletteRow,
      objectSizeMode,
      sizeOverride,
      objTilesPerRow,
      vramOffset,
      cgramOffset,
      parsedObj.format,
      hFlipOverride,
      vFlipOverride,
    );
  }, [
    visibleRecords,
    parsedObj,
    parsedCgx,
    parsedCol,
    bitDepth,
    scale,
    paletteMode,
    manualPaletteRow,
    objectSizeMode,
    sizePreviewMode,
    sizeOverride,
    objTilesPerRow,
    hFlipOverride,
    vFlipOverride,
    vramOffset,
    cgramOffset,
  ]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (groups.length <= 1) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIsPlaying(false);
        setGroupIndex((current) => Math.max(0, current - 1));
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIsPlaying(false);
        setGroupIndex((current) => Math.min(groups.length - 1, current + 1));
      } else if (event.key === ' ') {
        if (!selectedSequence) return;
        event.preventDefault();
        setIsPlaying((current) => !current);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [groups.length, selectedSequence]);

  const palettePreview = useMemo(() => {
    if (!parsedCol) return null;
    const row = parsedCol.rows[manualPaletteRow] || parsedCol.rows[0] || [];
    return row;
  }, [parsedCol, manualPaletteRow]);

  const vramStepWords = useMemo(() => bytesPerTile(bitDepth) / 2, [bitDepth]);

  function exportPng() {
    const suffix = groups.length > 1 ? `-frame-${groupIndex + 1}` : '';

    function exportCanvas(canvas: HTMLCanvasElement, nameSuffix: string) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${objName}${suffix}${nameSuffix}.png`;
      link.click();
    }

    if (sizePreviewMode === 'compare') {
      if (compareSmallRef.current) exportCanvas(compareSmallRef.current, '-small');
      if (compareLargeRef.current) exportCanvas(compareLargeRef.current, '-large');
      return;
    }

    if (!canvasRef.current) return;
    exportCanvas(canvasRef.current, '');
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div>
        <p>Load an SNES `.OBJ`, `.OBX`, or `.OBZ` file to render its framed object data. Add matching `.CGX` and `.COL` files to see the real tiles and palettes. The VRAM and CGRAM offsets default to `0` for direct companion-file viewing.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <label>
            OBJ / OBX / OBZ:
            <div><FileUpload accept=".obj,.OBJ,.obx,.OBX,.obz,.OBZ,.obj10,.OBJ10" onLoad={(buffer, file) => { setObjBuffer(buffer); setObjName(file?.name || 'object-layout'); setObjFileName(file?.name || null); }} /></div>
          </label>
          <label>
            Format override:
            <select
              value={objFormatOverride}
              onChange={(event) => setObjFormatOverride(event.target.value as ObjFormatOverride)}
              style={{ marginLeft: '0.5rem' }}
              disabled={!objBuffer}
            >
              <option value="auto">Auto detect</option>
              <option value="obj">CAD OBJ/OBX (6-byte)</option>
              <option value="obj10">CAD10 / pr_obj__ (10-byte)</option>
              <option value="obz">OBZ (6-byte)</option>
            </select>
          </label>
          <label>
            CGX:
            <div><FileUpload accept=".cgx,.CGX" onLoad={(buffer) => setCgxBuffer(buffer)} /></div>
          </label>
          <label>
            COL:
            <div><FileUpload accept=".col,.COL" onLoad={(buffer) => setColBuffer(buffer)} /></div>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <label>
          Palette mode:
          <select
            value={paletteMode}
            onChange={(event) => setPaletteMode(event.target.value as PaletteMode)}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="attr">Use OBJ attr bits 1-3</option>
            <option value="manual">Manual row</option>
          </select>
        </label>

        {paletteMode === 'manual' && (
          <label>
            Manual row:
            <input
              type="number"
              min={0}
              max={31}
              value={manualPaletteRow}
              onChange={(event) => setManualPaletteRow(Math.max(0, Math.min(31, Number(event.target.value) || 0)))}
              style={{ marginLeft: '0.5rem', width: '4rem' }}
            />
          </label>
        )}
      </div>

      {parsedObj && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <label>
              Scale:
              <input
                type="range"
                min={1}
                max={8}
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
                style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}
              />
              <span style={{ marginLeft: '0.5rem' }}>{scale}x</span>
            </label>

            <button type="button" onClick={exportPng}>Export Rendered PNG</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <label>
              Size preview:
              <select
                value={sizePreviewMode}
                onChange={(event) => setSizePreviewMode(event.target.value as SizePreviewMode)}
                style={{ marginLeft: '0.5rem' }}
              >
                <option value="normal">Single canvas</option>
                <option value="compare">Compare small vs large</option>
              </select>
            </label>

            {sizePreviewMode === 'normal' ? (
              <label>
                Size override:
                <select
                  value={sizeOverride}
                  onChange={(event) => setSizeOverride(event.target.value as SizeOverride)}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <option value="auto">Use entry flag</option>
                  <option value="small">Force small</option>
                  <option value="large">Force large</option>
                </select>
              </label>
            ) : null}

            <label>
              OBJ tiles/row:
              <input
                type="number"
                min={1}
                max={64}
                value={objTilesPerRow}
                onChange={(event) => setObjTilesPerRow(Math.max(1, Math.min(64, Number(event.target.value) || 16)))}
                style={{ marginLeft: '0.5rem', width: '5rem' }}
              />
            </label>
          </div>

          {sizePreviewMode === 'compare' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              <div style={{ overflow: 'auto', border: '1px solid #ccc', padding: '0.5rem', background: '#111' }}>
                <div style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Forced small</div>
                <canvas ref={compareSmallRef} />
              </div>
              <div style={{ overflow: 'auto', border: '1px solid #ccc', padding: '0.5rem', background: '#111' }}>
                <div style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Forced large</div>
                <canvas ref={compareLargeRef} />
              </div>
            </div>
          ) : (
            <div style={{ overflow: 'auto', border: '1px solid #ccc', padding: '0.5rem', background: '#111' }}>
              <canvas ref={canvasRef} />
            </div>
          )}

          {groups.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setGroupIndex((current) => Math.max(0, current - 1))}
                disabled={groupIndex <= 0}
              >
                Previous Frame
              </button>
              <label>
                Frame:
                <select
                  value={groupIndex}
                  onChange={(event) => setGroupIndex(Number(event.target.value))}
                  style={{ marginLeft: '0.5rem', maxWidth: '18rem' }}
                >
                  {groups.map((group, index) => (
                    <option key={`${group.label}-${index}`} value={index}>
                      {index + 1}. {group.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setGroupIndex((current) => Math.min(groups.length - 1, current + 1))}
                disabled={groupIndex >= groups.length - 1}
              >
                Next Frame
              </button>
            </div>
          )}

          {parsedObj.sequences.length > 0 && groups.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <label>
                Sequence:
                <select
                  value={sequenceIndex ?? ''}
                  onChange={(event) => {
                    const raw = event.target.value;
                    if (raw === '') {
                      setIsPlaying(false);
                      setSequenceIndex(null);
                      return;
                    }
                    const next = Number(raw);
                    setIsPlaying(false);
                    setSequenceIndex(next);
                    const seq = parsedObj.sequences.find((item) => item.index === next);
                    if (seq?.steps?.length) {
                      setGroupIndex(Math.max(0, Math.min(groups.length - 1, seq.steps[0].frame)));
                    }
                  }}
                  style={{ marginLeft: '0.5rem', maxWidth: '22rem' }}
                >
                  <option value="">None</option>
                  {parsedObj.sequences.map((seq) => (
                    <option key={`seq-${seq.index}`} value={seq.index}>
                      SEQ {seq.index} ({seq.steps.length} steps)
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => setIsPlaying((current) => !current)}
                disabled={!selectedSequence}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              {selectedSequence ? (
                <div style={{ opacity: 0.9 }}>
                  Step {sequenceStepIndex + 1} of {selectedSequence.steps.length} (press Space to toggle)
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <label>
          Bit depth:
          <select value={bitDepth} onChange={(event) => setBitDepth(Number(event.target.value) as BitDepth)} style={{ marginLeft: '0.5rem' }}>
            <option value={2}>2bpp</option>
            <option value={4}>4bpp</option>
            <option value={8}>8bpp</option>
          </select>
        </label>

        <label>
          Chunk size:
          <select value={groupMode} onChange={(event) => setGroupMode(event.target.value as GroupMode)} style={{ marginLeft: '0.5rem' }}>
            <option value="frame4">4-entry chunks</option>
            <option value="frame8">8-entry chunks</option>
            <option value="frame16">16-entry chunks</option>
            <option value="frame32">32-entry frames</option>
            <option value="frame64">64-entry frames</option>
            <option value="frame128">128-entry frames</option>
          </select>
        </label>

        <label>
          Cluster:
          <select
            value={clusterIndex}
            onChange={(event) => setClusterIndex(Number(event.target.value) || 0)}
            style={{ marginLeft: '0.5rem' }}
            disabled={clusters.length <= 1}
          >
            {clusters.map((cluster, index) => (
              <option key={cluster.label} value={index}>
                {cluster.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          OBJ size:
          <select value={objectSizeMode} onChange={(event) => setObjectSizeMode(Number(event.target.value))} style={{ marginLeft: '0.5rem' }}>
            {Object.entries(OBJECT_SIZE_SETTINGS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          H flip:
          <select
            value={hFlipOverride}
            onChange={(event) => setHFlipOverride(event.target.value as FlipOverride)}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="auto">Auto</option>
            <option value="off">Force off</option>
            <option value="on">Force on</option>
          </select>
        </label>

        <label>
          V flip:
          <select
            value={vFlipOverride}
            onChange={(event) => setVFlipOverride(event.target.value as FlipOverride)}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="auto">Auto</option>
            <option value="off">Force off</option>
            <option value="on">Force on</option>
          </select>
        </label>

        <label>
          VRAM offset (words):
          <input
            type="number"
            value={vramOffset}
            onChange={(event) => setVramOffset(Number(event.target.value) || 0)}
            step={vramStepWords}
            style={{ marginLeft: '0.5rem', width: '6rem' }}
          />
          <span style={{ marginLeft: '0.5rem', opacity: 0.85 }}>
            step {vramStepWords} = 1 tile
          </span>
        </label>

        <label>
          CGRAM offset:
          <input
            type="number"
            value={cgramOffset}
            onChange={(event) => setCgramOffset(Number(event.target.value) || 0)}
            style={{ marginLeft: '0.5rem', width: '6rem' }}
          />
        </label>
      </div>

      {parsedObj && (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div>
            <strong>Format:</strong> {parsedObj.format === 'obz' ? 'OBZ' : parsedObj.format === 'obj10' ? 'OBJ10 (pr_obj__)' : 'OBJ/OBX'}
          </div>
          <div>
            <strong>Record region:</strong> {parsedObj.recordRegionBytes.toLocaleString()} bytes ({parsedObj.recordCount.toLocaleString()} record slots)
          </div>
          <div>
            <strong>Metadata tail:</strong> {parsedObj.metadataTailBytes.toLocaleString()} bytes
          </div>
          <div>
            <strong>Displayed records:</strong> {parsedObj.displayedCount.toLocaleString()}
          </div>
          <div>
            <strong>Visible slots:</strong> {visibleRecords.length.toLocaleString()}
          </div>
          <div>
            <strong>Groups:</strong> {groups.length.toLocaleString()}
            {groups.length > 0 ? ` (${groups[Math.max(0, Math.min(groupIndex, groups.length - 1))].label})` : ''}
          </div>
          <div>
            <strong>OBJ size mode:</strong> {OBJECT_SIZE_SETTINGS[objectSizeMode as keyof typeof OBJECT_SIZE_SETTINGS]?.label}
          </div>
          <div>
            <strong>VRAM offset:</strong> {vramOffset}
          </div>
          <div>
            <strong>CGRAM offset:</strong> {cgramOffset}
          </div>
          <div>
            <strong>Byte 1 values:</strong> {parsedObj.byte1Values.map((value) => formatHex(value, 2)).join(', ')}
          </div>
          <div>
            <strong>Byte 2 values:</strong> {parsedObj.groupInfoValues.slice(0, 16).map((value) => formatHex(value, 2)).join(', ')}
          </div>
          <div>
            <strong>Sample attrs:</strong> {parsedObj.attrs.slice(0, 16).map((attr) => formatHex(attr, 2)).join(', ')}
          </div>
          {parsedObj.format === 'obz' ? (
            <div>
              <strong>OBZ diagnostics:</strong> {parsedObj.obzTerminatedFrames} terminated frames, {parsedObj.obzBabyMarkers} baby markers, {parsedObj.obzEggMarkers} egg markers
            </div>
          ) : null}
          {parsedObj.warnings.length > 0 && (
            <ul>
              {parsedObj.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {parsedCgx?.warnings.length ? (
            <ul>
              {parsedCgx.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {parsedCol && palettePreview && (
        <div>
          <strong>Manual palette row preview:</strong>
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            {palettePreview.map((color) => (
              <div key={`${color.hex}-${color.rgbHex}`} title={`${color.hex} ${color.rgbHex}`} style={{ textAlign: 'center' }}>
                <div style={{ width: '2rem', height: '2rem', background: color.rgbHex, border: '1px solid #777' }} />
                <small>{color.hex}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <p>
        This viewer supports multiple object layouts. CAD OBJ/OBX uses 6-byte slots (byte <code>0</code> flags, byte <code>1</code> group info, byte <code>2</code> <code>Y</code>, byte <code>3</code> <code>X</code>, byte <code>4</code> attributes, byte <code>5</code> tile number). OBZ uses 6-byte slots with a different order (byte <code>0</code> flags and tile high nibble, byte <code>1</code> tile low, byte <code>2</code> <code>X</code>, byte <code>3</code> <code>Y</code>, byte <code>4</code> attributes, byte <code>5</code> group info). The printer/report layout (<code>.obj10</code>, detected as 0xA000 bytes) uses 10-byte entries (byte <code>0</code> flags, byte <code>1</code> flip selector, byte <code>3</code> palette nibble, byte <code>5</code> <code>Y</code>, byte <code>6</code> <code>X</code>, bytes <code>8..9</code> tile id).
        When palette mode is set to <code>Use OBJ attr bits 1-3</code>, the viewer interprets the attribute byte like a SNES sprite attribute field and only draws entries whose display bit is set.
      </p>
    </div>
  );
}

export default SnesObjViewer;
