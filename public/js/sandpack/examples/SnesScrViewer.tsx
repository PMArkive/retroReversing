import { useEffect, useMemo, useRef, useState } from 'react';
import FileUpload from './FileUpload';

type BitDepth = 2 | 4 | 8;
type ViewMode = 'all' | 0 | 1 | 2 | 3;
type ScrSource = 'scr' | 'map+pnl';

type MapPanelBankMode = 'auto' | 0 | 1 | 2 | 3;

interface AutoDetectResult {
  recommended: BitDepth | null;
  fits: BitDepth[];
  maxTileIndex: number;
}

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
  tileTable?: Uint8Array;
  tileTableShift?: number;
  warnings: string[];
}

interface ScrEntry {
  raw: number;
  tileIndex: number;
  paletteIndex: number;
  priority: number;
  hFlip: boolean;
  vFlip: boolean;
}

interface ParsedScr {
  byteLength: number;
  layoutBytes: number;
  metadataBytes: number;
  trailerBytes: number;
  extraBytes: number;
  wordEndianness: 'le' | 'be';
  cadHeader?: {
    signature: string;
    scbank?: number;
    mode41?: number;
    flag42?: number;
    mode43?: number;
    mode44?: number;
    byte45?: number;
    byte46?: number;
    value47_48?: number;
  };
  entryCount: number;
  blockCount: number;
  blocks: ScrEntry[][];
  warnings: string[];
  paletteUsage: number[];
  priorityUsage: number[];
  hFlipUsage: number[];
  vFlipUsage: number[];
}

function detectBitDepth(scr: ParsedScr | null, cgxBuffer: Uint8Array | null): AutoDetectResult | null {
  if (!scr || !cgxBuffer) return null;

  const tileIndexes = scr.blocks.flat().map((entry) => entry.tileIndex);
  if (tileIndexes.length === 0) return null;

  function effectiveCgxLength(bitDepth: BitDepth): number {
    const tileSize = bytesPerTile(bitDepth);
    const standardBankBytes = 1024 * tileSize;
    if (cgxBuffer.length >= standardBankBytes + 0x20) {
      const header = new TextDecoder().decode(cgxBuffer.slice(standardBankBytes, standardBankBytes + 0x20));
      if (header.includes('NAK1989') && header.includes('S-CG-CAD')) {
        return standardBankBytes;
      }
    }
    return cgxBuffer.length;
  }

  const maxTileIndex = Math.max(...tileIndexes);
  const fits = ([2, 4, 8] as BitDepth[]).filter(
    (bitDepth) => Math.floor(effectiveCgxLength(bitDepth) / bytesPerTile(bitDepth)) > maxTileIndex,
  );

  return {
    recommended: fits[0] ?? null,
    fits,
    maxTileIndex,
  };
}

function bytesPerTile(bitDepth: BitDepth): number {
  if (bitDepth === 2) return 16;
  if (bitDepth === 4) return 32;
  return 64;
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
  const colors: PaletteColor[] = [];
  const wordCount = Math.floor(buffer.length / 2);

  for (let i = 0; i < wordCount; i += 1) {
    const offset = i * 2;
    const value = buffer[offset] | (buffer[offset + 1] << 8);
    colors.push(decodePaletteColor(value));
  }

  const rows: PaletteColor[][] = [];
  for (let i = 0; i < colors.length; i += 16) {
    rows.push(colors.slice(i, i + 16));
  }

  return { rows };
}

function parseCgx(buffer: Uint8Array, bitDepth: BitDepth): ParsedCgx {
  const warnings: string[] = [];
  const tileSize = bytesPerTile(bitDepth);
  const standardBankBytes = 1024 * tileSize;
  let source = buffer;
  let tileTable: Uint8Array | undefined;
  let tileTableShift: number | undefined;

  if (buffer.length >= standardBankBytes + 0x100) {
    const header = new TextDecoder().decode(buffer.slice(standardBankBytes, standardBankBytes + 0x20));
    if (header.includes('NAK1989') && header.includes('S-CG-CAD')) {
      source = buffer.slice(0, standardBankBytes);
      warnings.push('Detected S-CG-CAD CGX metadata tail. Rendered only the front tile record region.');
      if (buffer.length >= standardBankBytes + 0x500 && (bitDepth === 2 || bitDepth === 4)) {
        tileTable = buffer.slice(standardBankBytes + 0x100, standardBankBytes + 0x500);
        tileTableShift = bitDepth === 2 ? 2 : 4;
        warnings.push(
          'Note: this CGX also contains a 0x400 per-tile table (S-CG-CAD palette prefix metadata). Use the toggle below if you want to apply it for debugging.',
        );
      }
    }
  }

  const tileCount = Math.floor(source.length / tileSize);
  const remainder = source.length % tileSize;

  if (remainder !== 0) {
    warnings.push(
      `${remainder} trailing bytes do not fit the selected ${bitDepth}bpp tile size and were ignored.`,
    );
  }

  const tiles: Uint8Array[] = [];
  for (let i = 0; i < tileCount; i += 1) {
    const start = i * tileSize;
    tiles.push(source.slice(start, start + tileSize));
  }

  return {
    tileCount,
    bytesPerTile: tileSize,
    tiles,
    tileTable,
    tileTableShift,
    warnings,
  };
}

function parseScr(buffer: Uint8Array): ParsedScr | null {
  if (buffer.length < 2) return null;

  const warnings: string[] = [];
  if (buffer.length % 2 !== 0) {
    warnings.push('Odd file size detected. The final byte was ignored.');
  }

  let wordEndianness: 'le' | 'be' = 'le';
  let cadHeader: ParsedScr['cadHeader'];
  if (buffer.length >= 0x8000 + 0x20) {
    const signature = new TextDecoder().decode(buffer.slice(0x8000, 0x8000 + 0x20));
    if (signature.includes('NAK1989') && signature.includes('S-CG-CAD')) {
      wordEndianness = 'be';
      cadHeader = {
        signature: signature.replace(/\0.*$/, ''),
        scbank: buffer[0x8000 + 0x40],
        mode41: buffer[0x8000 + 0x41] & 0x03,
        flag42: buffer[0x8000 + 0x42] & 0x02,
        mode43: buffer[0x8000 + 0x43] & 0x03,
        mode44: buffer[0x8000 + 0x44] & 0x03,
        byte45: buffer[0x8000 + 0x45],
        byte46: buffer[0x8000 + 0x46],
        value47_48: (buffer[0x8000 + 0x47] << 8) | buffer[0x8000 + 0x48],
      };
      warnings.push('Detected S-CG-CAD SCR metadata tail. Parsed the 16-bit tilemap words as big-endian.');
    }
  }

  const layoutBytes = Math.min(buffer.length, 8192);
  const wordCount = Math.floor(layoutBytes / 2);
  const blockCount = Math.min(4, Math.floor(wordCount / 1024));
  const blocks: ScrEntry[][] = [];

  const paletteSet = new Set<number>();
  const prioritySet = new Set<number>();
  const hFlipSet = new Set<number>();
  const vFlipSet = new Set<number>();

  for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
    const entries: ScrEntry[] = [];
    const startWord = blockIndex * 1024;

    for (let i = 0; i < 1024 && startWord + i < wordCount; i += 1) {
      const wordOffset = (startWord + i) * 2;
      const raw =
        wordEndianness === 'be'
          ? (buffer[wordOffset] << 8) | buffer[wordOffset + 1]
          : buffer[wordOffset] | (buffer[wordOffset + 1] << 8);
      const entry: ScrEntry = {
        raw,
        tileIndex: raw & 0x03ff,
        paletteIndex: (raw >> 10) & 0x07,
        priority: (raw >> 13) & 0x01,
        hFlip: ((raw >> 14) & 0x01) === 1,
        vFlip: ((raw >> 15) & 0x01) === 1,
      };
      entries.push(entry);
      paletteSet.add(entry.paletteIndex);
      prioritySet.add(entry.priority);
      hFlipSet.add(entry.hFlip ? 1 : 0);
      vFlipSet.add(entry.vFlip ? 1 : 0);
    }

    blocks.push(entries);
  }

  const metadataBytes = buffer.length > 8192 ? Math.min(buffer.length - 8192, 256) : 0;
  const trailerBytes =
    buffer.length > 8448 ? Math.min(buffer.length - 8448, 512) : Math.max(0, buffer.length - 8448);
  const extraBytes = Math.max(0, buffer.length - 8960);

  if (buffer.length < 8192) {
    warnings.push('This file is shorter than the common four-block 8192-byte SCR layout region.');
  } else if (buffer.length > 8192) {
    warnings.push(
      'This viewer renders the first 8192 bytes as four 32x32 tilemap blocks and leaves later metadata and trailer regions unrendered.',
    );
  }

  return {
    byteLength: buffer.length,
    layoutBytes,
    metadataBytes,
    trailerBytes,
    extraBytes,
    wordEndianness,
    cadHeader,
    entryCount: wordCount,
    blockCount,
    blocks,
    warnings,
    paletteUsage: [...paletteSet].sort((a, b) => a - b),
    priorityUsage: [...prioritySet].sort((a, b) => a - b),
    hFlipUsage: [...hFlipSet].sort((a, b) => a - b),
    vFlipUsage: [...vFlipSet].sort((a, b) => a - b),
  };
}

function deriveScrFromMapPnl(
  mapBuffer: Uint8Array,
  pnlBuffer: Uint8Array,
  defaultTileId: number,
  panelBankMode: MapPanelBankMode,
): ParsedScr {
  const warnings: string[] = [];

  if (mapBuffer.length !== 0x2100) {
    warnings.push(`Expected a 0x2100-byte S-CG-CAD MAP file. Got ${mapBuffer.length} bytes.`);
  }
  if (pnlBuffer.length !== 0x10100) {
    warnings.push(`Expected a 0x10100-byte S-CG-CAD PNL file. Got ${pnlBuffer.length} bytes.`);
  }

  const headerPanelBank = mapBuffer.length >= 0x71 ? mapBuffer[0x70] & 0x03 : 0;
  const resolvedPanelBank = panelBankMode === 'auto' ? headerPanelBank : panelBankMode;
  warnings.push(
    `MAP panelBank=${resolvedPanelBank} (${panelBankMode === 'auto' ? 'from header[0x70]' : 'manual override'}).`,
  );

  const pnlTileTableStart = 0x0100;
  const pnlFlagTableStart = 0x8100;
  const pnlEntryCount = 0x4000;

  type PnlTile = {
    present: boolean;
    tileId: number;
    palRow: number;
    priority: number;
    hFlip: boolean;
    vFlip: boolean;
  };

  const pnlTiles: PnlTile[] = new Array(pnlEntryCount);
  for (let i = 0; i < pnlEntryCount; i += 1) {
    const wordOffset = pnlTileTableStart + i * 2;
    const flagOffset = pnlFlagTableStart + i * 2;
    const word =
      wordOffset + 1 < pnlBuffer.length ? (pnlBuffer[wordOffset] << 8) | pnlBuffer[wordOffset + 1] : 0;
    const flagWord =
      flagOffset + 1 < pnlBuffer.length ? (pnlBuffer[flagOffset] << 8) | pnlBuffer[flagOffset + 1] : 0;
    pnlTiles[i] = {
      present: (flagWord & 0x8000) !== 0,
      tileId: word & 0x03ff,
      palRow: (word >> 10) & 0x07,
      priority: (word >> 13) & 0x01,
      hFlip: ((word >> 14) & 0x01) === 1,
      vFlip: ((word >> 15) & 0x01) === 1,
    };
  }

  const mapEntriesStart = 0x0100;
  const blocks: ScrEntry[][] = [[], [], [], []];

  for (let cellIndex = 0; cellIndex < 0x1000; cellIndex += 1) {
    const mapWordOffset = mapEntriesStart + cellIndex * 2;
    const mapWord =
      mapWordOffset + 1 < mapBuffer.length ? (mapBuffer[mapWordOffset] << 8) | mapBuffer[mapWordOffset + 1] : 0;

    const attrSource = (mapWord & 0x4000) !== 0;
    const panelY = (mapWord >> 5) & 0x01ff;
    const panelX = mapWord & 0x001f;
    const panelTileIndex = panelY * 32 + panelX;

    const panelTile = pnlTiles[panelTileIndex] ?? {
      present: false,
      tileId: 0,
      palRow: 0,
      priority: 0,
      hFlip: false,
      vFlip: false,
    };

    const tileId = panelTile.present ? (attrSource ? panelTile.tileId : defaultTileId & 0x03ff) : 0;
    const raw =
      tileId |
      ((panelTile.palRow & 0x07) << 10) |
      ((panelTile.priority & 0x01) << 13) |
      ((panelTile.hFlip ? 1 : 0) << 14) |
      ((panelTile.vFlip ? 1 : 0) << 15);

    const entry: ScrEntry = {
      raw,
      tileIndex: raw & 0x03ff,
      paletteIndex: (raw >> 10) & 0x07,
      priority: (raw >> 13) & 0x01,
      hFlip: ((raw >> 14) & 0x01) === 1,
      vFlip: ((raw >> 15) & 0x01) === 1,
    };

    const row = Math.floor(cellIndex / 64);
    const col = cellIndex % 64;
    const blockIndex = (row < 32 ? 0 : 2) + (col < 32 ? 0 : 1);
    blocks[blockIndex].push(entry);
  }

  const paletteSet = new Set<number>();
  const prioritySet = new Set<number>();
  const hFlipSet = new Set<number>();
  const vFlipSet = new Set<number>();
  for (const block of blocks) {
    for (const entry of block) {
      paletteSet.add(entry.paletteIndex);
      prioritySet.add(entry.priority);
      hFlipSet.add(entry.hFlip ? 1 : 0);
      vFlipSet.add(entry.vFlip ? 1 : 0);
    }
  }

  warnings.push('Derived SCR: MAP provides panel coordinates and attribute-source flag; PNL provides flip/priority/palette and (optionally) tileId.');

  return {
    byteLength: 8192,
    layoutBytes: 8192,
    metadataBytes: 0,
    trailerBytes: 0,
    extraBytes: 0,
    wordEndianness: 'be',
    cadHeader: undefined,
    entryCount: 4096,
    blockCount: 4,
    blocks,
    warnings,
    paletteUsage: [...paletteSet].sort((a, b) => a - b),
    priorityUsage: [...prioritySet].sort((a, b) => a - b),
    hFlipUsage: [...hFlipSet].sort((a, b) => a - b),
    vFlipUsage: [...vFlipSet].sort((a, b) => a - b),
  };
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

function getDiagnosticColor(entry: ScrEntry, pixelIndex: number, bitDepth: BitDepth): [number, number, number] {
  const max = (1 << Math.min(bitDepth, 4)) - 1;
  const brightness = Math.round((pixelIndex / Math.max(max, 1)) * 255);
  const paletteTint = Math.round((entry.paletteIndex / 7) * 180);
  const flipTint = entry.hFlip || entry.vFlip ? 50 : 0;
  return [brightness, Math.min(255, paletteTint + brightness / 4), Math.min(255, flipTint + 40)];
}

function getPaletteRgb(
  palette: ParsedCol | null,
  paletteIndex: number,
  colorIndex: number,
  bitDepth: BitDepth,
  rowOverride?: number,
): [number, number, number] {
  if (!palette) {
    return [0, 0, 0];
  }

  if (bitDepth === 8) {
    const flat = palette.rows.flat().slice(0, 256);
    const picked = flat[colorIndex];
    if (!picked) return [0, 0, 0];
    return [
      parseInt(picked.rgbHex.slice(1, 3), 16),
      parseInt(picked.rgbHex.slice(3, 5), 16),
      parseInt(picked.rgbHex.slice(5, 7), 16),
    ];
  }

  const resolvedRowIndex = rowOverride != null ? rowOverride : paletteIndex;
  const row = palette.rows[resolvedRowIndex] || palette.rows[0];
  const rowSize = bitDepth === 2 ? 4 : 16;
  const picked = row?.[colorIndex % rowSize];
  if (!picked) return [0, 0, 0];
  return [
    parseInt(picked.rgbHex.slice(1, 3), 16),
    parseInt(picked.rgbHex.slice(3, 5), 16),
    parseInt(picked.rgbHex.slice(5, 7), 16),
  ];
}

function drawEntry(
  imageData: Uint8ClampedArray,
  canvasWidth: number,
  startX: number,
  startY: number,
  entry: ScrEntry,
  tile: Uint8Array | null,
  bitDepth: BitDepth,
  palette: ParsedCol | null,
  tilePrefix: number,
) {
  for (let py = 0; py < 8; py += 1) {
    for (let px = 0; px < 8; px += 1) {
      let red = 0;
      let green = 0;
      let blue = 0;

      if (tile) {
        const sourceX = entry.hFlip ? 7 - px : px;
        const sourceY = entry.vFlip ? 7 - py : py;
        const baseIndex = decodePixel(tile, bitDepth, sourceX, sourceY);
        const combinedIndex = tilePrefix | baseIndex;

        if (palette && tilePrefix !== 0 && bitDepth !== 8) {
          if (bitDepth === 4) {
            const resolvedRow = (combinedIndex >> 4) & 0x0f;
            const resolvedIndex = combinedIndex & 0x0f;
            [red, green, blue] = getPaletteRgb(palette, entry.paletteIndex, resolvedIndex, bitDepth, resolvedRow);
          } else {
            const resolvedRow = (combinedIndex >> 2) & 0x3f;
            const resolvedIndex = combinedIndex & 0x03;
            [red, green, blue] = getPaletteRgb(palette, entry.paletteIndex, resolvedIndex, bitDepth, resolvedRow);
          }
        } else {
          [red, green, blue] = getPaletteRgb(palette, entry.paletteIndex, combinedIndex, bitDepth);
        }

        if (!palette) {
          const shade =
            bitDepth === 8
              ? combinedIndex
              : Math.round(((combinedIndex & ((1 << bitDepth) - 1)) / ((1 << bitDepth) - 1)) * 255);
          red = shade;
          green = shade;
          blue = shade;
        }
      } else {
        const diagnosticIndex = (entry.tileIndex + px + py) & ((1 << Math.min(bitDepth, 4)) - 1);
        [red, green, blue] = getDiagnosticColor(entry, diagnosticIndex, bitDepth);
      }

      const outputIndex = ((startY + py) * canvasWidth + (startX + px)) * 4;
      imageData[outputIndex] = red;
      imageData[outputIndex + 1] = green;
      imageData[outputIndex + 2] = blue;
      imageData[outputIndex + 3] = 255;
    }
  }
}

function drawScr(
  canvas: HTMLCanvasElement,
  scr: ParsedScr,
  cgx: ParsedCgx | null,
  palette: ParsedCol | null,
  bitDepth: BitDepth,
  scale: number,
  viewMode: ViewMode,
  applyCadTileTable: boolean,
) {
  const blockWidth = 32 * 8;
  const blockHeight = 32 * 8;
  const showAll = viewMode === 'all';
  const canvasWidth = showAll ? blockWidth * 2 : blockWidth;
  const canvasHeight = showAll ? blockHeight * 2 : blockHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.style.width = `${canvasWidth * scale}px`;
  canvas.style.height = `${canvasHeight * scale}px`;
  canvas.style.imageRendering = 'pixelated';

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const image = ctx.createImageData(canvasWidth, canvasHeight);
  const data = image.data;

  const blockIndexes = showAll ? [0, 1, 2, 3] : [viewMode];

  for (const blockIndex of blockIndexes) {
    const block = scr.blocks[blockIndex];
    if (!block) continue;

    const blockOffsetX = showAll ? (blockIndex % 2) * blockWidth : 0;
    const blockOffsetY = showAll ? Math.floor(blockIndex / 2) * blockHeight : 0;

    for (let tileIndex = 0; tileIndex < block.length; tileIndex += 1) {
      const entry = block[tileIndex];
      const tileX = (tileIndex % 32) * 8;
      const tileY = Math.floor(tileIndex / 32) * 8;
      const tile = cgx?.tiles[entry.tileIndex] || null;
      const tilePrefix =
        applyCadTileTable && cgx?.tileTable && cgx.tileTableShift != null && bitDepth !== 8
          ? cgx.tileTable[entry.tileIndex] << cgx.tileTableShift
          : 0;
      drawEntry(
        data,
        canvasWidth,
        blockOffsetX + tileX,
        blockOffsetY + tileY,
        entry,
        tile,
        bitDepth,
        palette,
        tilePrefix,
      );
    }
  }

  ctx.putImageData(image, 0, 0);
}

function SnesScrViewer(props: { initialSource?: ScrSource } = {}) {
  const [scrBuffer, setScrBuffer] = useState<Uint8Array | null>(null);
  const [cgxBuffer, setCgxBuffer] = useState<Uint8Array | null>(null);
  const [colBuffer, setColBuffer] = useState<Uint8Array | null>(null);
  const [mapBuffer, setMapBuffer] = useState<Uint8Array | null>(null);
  const [pnlBuffers, setPnlBuffers] = useState<(Uint8Array | null)[]>([null, null, null, null]);
  const [defaultsScrBuffer, setDefaultsScrBuffer] = useState<Uint8Array | null>(null);
  const [scrFileName, setScrFileName] = useState('snes-scr-render');
  const [scrSource, setScrSource] = useState<ScrSource>(props.initialSource ?? 'scr');
  const [mapDefaultTileId, setMapDefaultTileId] = useState(0);
  const [mapPanelBankMode, setMapPanelBankMode] = useState<MapPanelBankMode>('auto');
  const [bitDepth, setBitDepth] = useState<BitDepth>(4);
  const [manualBitDepth, setManualBitDepth] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [scale, setScale] = useState(2);
  const [applyCadTileTable, setApplyCadTileTable] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const scr = useMemo(() => {
    if (scrSource === 'scr') {
      if (!scrBuffer) return null;
      return parseScr(scrBuffer);
    }
    if (!mapBuffer) return null;
    const headerPanelBank = mapBuffer.length >= 0x71 ? mapBuffer[0x70] & 0x03 : 0;
    const bank = mapPanelBankMode === 'auto' ? headerPanelBank : mapPanelBankMode;
    const pnlBuffer = pnlBuffers[bank] ?? null;
    if (!pnlBuffer) return null;
    return deriveScrFromMapPnl(mapBuffer, pnlBuffer, mapDefaultTileId, mapPanelBankMode);
  }, [scrSource, scrBuffer, mapBuffer, pnlBuffers, mapDefaultTileId, mapPanelBankMode]);

  const mapPnlBankWarning = useMemo(() => {
    if (scrSource !== 'map+pnl' || !mapBuffer) return null;
    const headerPanelBank = mapBuffer.length >= 0x71 ? mapBuffer[0x70] & 0x03 : 0;
    const bank = mapPanelBankMode === 'auto' ? headerPanelBank : mapPanelBankMode;
    if (!pnlBuffers[bank]) {
      return `Missing PNL bank ${bank}. Load the matching .PNL for this MAP, or switch MAP panelBank to a loaded bank.`;
    }
    if (mapPanelBankMode !== 'auto' && bank !== headerPanelBank) {
      return `MAP panelBank override active: MAP header requests bank ${headerPanelBank}, but viewer is using bank ${bank}.`;
    }
    return null;
  }, [scrSource, mapBuffer, mapPanelBankMode, pnlBuffers]);

  const defaultsScr = useMemo(() => {
    if (!defaultsScrBuffer) return null;
    return parseScr(defaultsScrBuffer);
  }, [defaultsScrBuffer]);

  useEffect(() => {
    if (scrSource !== 'map+pnl') return;
    const stampBase = defaultsScr?.cadHeader?.value47_48;
    if (stampBase == null) return;
    setMapDefaultTileId(stampBase & 0x03ff);
  }, [scrSource, defaultsScr]);

  const cgx = useMemo(() => {
    if (!cgxBuffer) return null;
    return parseCgx(cgxBuffer, bitDepth);
  }, [cgxBuffer, bitDepth]);

  const palette = useMemo(() => {
    if (!colBuffer) return null;
    return parseCol(colBuffer);
  }, [colBuffer]);

  const autoDetect = useMemo(() => detectBitDepth(scr, cgxBuffer), [scr, cgxBuffer]);

  useEffect(() => {
    if (!autoDetect?.recommended || manualBitDepth) return;
    setBitDepth(autoDetect.recommended);
  }, [autoDetect, manualBitDepth]);

  useEffect(() => {
    if (!scr || !canvasRef.current) return;
    drawScr(canvasRef.current, scr, cgx, palette, bitDepth, scale, viewMode, applyCadTileTable);
  }, [scr, cgx, palette, bitDepth, scale, viewMode, applyCadTileTable]);

  function downloadRenderedImage() {
    if (!canvasRef.current) return;

    const baseName = scrFileName.replace(/\.[^/.]+$/, '') || 'snes-scr-render';
    const viewSuffix = viewMode === 'all' ? 'all-blocks' : `block-${viewMode}`;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = `${baseName}-${viewSuffix}.png`;
    link.click();
  }

  return (
    <div className="p-4 space-y-4">
      <h3>Load a SNES .SCR file to view its four 32x32 layout blocks:</h3>
      <p>
        This viewer treats the first 8192 bytes of the file as four standard SNES-style 32x32
        tilemap blocks. Add the matching .CGX and .COL files to render the full screen image.
      </p>

      <div>
        <div className="font-medium">Source</div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label>
            <select
              value={scrSource}
              onChange={(event) => {
                const value = event.target.value as ScrSource;
                setScrSource(value);
                setManualBitDepth(false);
              }}
            >
              <option value="scr">Load .SCR</option>
              <option value="map+pnl">Derive from .MAP + .PNL</option>
            </select>
          </label>

          {scrSource === 'map+pnl' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Default tile id (MAP attribute-source=0):
              <input
                type="number"
                min={0}
                max={1023}
                step={1}
                value={mapDefaultTileId}
                onChange={(event) => setMapDefaultTileId(Number(event.target.value) || 0)}
                style={{ width: '6rem' }}
              />
            </label>
          )}

          {scrSource === 'map+pnl' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              MAP panelBank:
              <select
                value={String(mapPanelBankMode)}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === 'auto') {
                    setMapPanelBankMode('auto');
                    return;
                  }
                  setMapPanelBankMode(Number(value) as MapPanelBankMode);
                }}
              >
                <option value="auto">Auto (use MAP header)</option>
                <option value="0">Force 0</option>
                <option value="1">Force 1</option>
                <option value="2">Force 2</option>
                <option value="3">Force 3</option>
              </select>
            </label>
          )}
        </div>
      </div>

      {scrSource === 'scr' && (
        <div>
          <div className="font-medium">Required .SCR file</div>
          <FileUpload
            accept=".scr,.SCR,.BAK"
            onLoad={(buffer, file) => {
              setScrBuffer(buffer);
              setManualBitDepth(false);
              if (file?.name) {
                setScrFileName(file.name);
              }
            }}
          />
        </div>
      )}

      {scrSource === 'map+pnl' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <div className="font-medium">Required .MAP file</div>
            <FileUpload
              accept=".map,.MAP,.BAK"
              onLoad={(buffer, file) => {
                setMapBuffer(buffer);
                setManualBitDepth(false);
                if (file?.name) setScrFileName(file.name);
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="font-medium">Required .PNL file(s)</div>
            <p style={{ marginTop: '0.25rem', color: '#4b5563' }}>
              You can load up to four PNL files (bank 0-3). When MAP panelBank is set to Auto, the
              viewer uses the bank id from MAP header byte 0x70.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginTop: '0.5rem',
              }}
            >
              {[0, 1, 2, 3].map((bank) => (
                <div key={`pnl-bank-${bank}`}>
                  <div style={{ fontWeight: 600 }}>PNL bank {bank}</div>
                  <FileUpload
                    accept=".pnl,.PNL,.BAK"
                    onLoad={(buffer) => {
                      setPnlBuffers((prev) => {
                        const next = [...prev];
                        next[bank] = buffer;
                        return next;
                      });
                      setManualBitDepth(false);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="font-medium">Optional .SCR file (auto-detects default tile id)</div>
            <p style={{ marginTop: '0.25rem', color: '#4b5563' }}>
              If provided and it contains an S-CG-CAD metadata tail, the viewer uses its stamp base
              tile value as the default tile id for MAP cells with attribute-source=0.
            </p>
            <FileUpload accept=".scr,.SCR,.BAK" onLoad={(buffer) => setDefaultsScrBuffer(buffer)} />
          </div>
        </div>
      )}

      <div>
        <div className="font-medium">Optional .CGX graphics file</div>
        <FileUpload
          accept=".cgx,.CGX,.bin,.BAK"
          onLoad={(buffer) => {
            setCgxBuffer(buffer);
            setManualBitDepth(false);
          }}
        />
      </div>

      <div>
        <div className="font-medium">Optional .COL palette file</div>
        <FileUpload accept=".col,.COL,.BAK" onLoad={(buffer) => setColBuffer(buffer)} />
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <input
            type="checkbox"
            checked={applyCadTileTable}
            onChange={(event) => setApplyCadTileTable(event.target.checked)}
          />
          Apply S-CG-CAD CGX per-tile palette prefix table (debug)
        </label>

        <label>
          View:{' '}
          <select
            value={String(viewMode)}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'all') {
                setViewMode('all');
                return;
              }
              setViewMode(Number(value) as ViewMode);
            }}
          >
            <option value="all">All 4 blocks</option>
            <option value="0">Block 0</option>
            <option value="1">Block 1</option>
            <option value="2">Block 2</option>
            <option value="3">Block 3</option>
          </select>
        </label>

        <label>
          CGX bit depth:{' '}
          <select
            value={bitDepth}
            onChange={(event) => {
              setManualBitDepth(true);
              setBitDepth(Number(event.target.value) as BitDepth);
            }}
          >
            <option value={2}>2bpp</option>
            <option value={4}>4bpp</option>
            <option value={8}>8bpp</option>
          </select>
        </label>

        <label>
          Zoom:{' '}
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
          />{' '}
          {scale}x
        </label>
      </div>

      {scr && (
        <div className="border border-gray-300 rounded p-3 bg-gray-50 space-y-1">
          <div className="font-medium">SCR Summary</div>
          <div>Source: {scrSource === 'scr' ? 'SCR file' : 'Derived from MAP+PNL'}</div>
          {mapPnlBankWarning && <div style={{ color: '#92400e' }}>{mapPnlBankWarning}</div>}
          <div>{scr.byteLength} bytes total</div>
          <div>{scr.layoutBytes} bytes rendered as tilemap blocks</div>
          <div>Word endianness: {scr.wordEndianness}</div>
          <div>{scr.entryCount} 16-bit entries across {scr.blockCount} detected blocks</div>
          {scr.cadHeader && (
            <div style={{ color: '#1f2937' }}>
              S-CG-CAD header: scbank={scr.cadHeader.scbank} mode41={scr.cadHeader.mode41} tileSizeMode=
              {scr.cadHeader.flag42 ? '16x16?' : '8x8?'} cgxBank={scr.cadHeader.mode43} colormapBank={scr.cadHeader.mode44}{' '}
              color45={scr.cadHeader.byte45} color46={scr.cadHeader.byte46} stampBase=0x
              {scr.cadHeader.value47_48?.toString(16).toUpperCase().padStart(4, '0')}
            </div>
          )}
          {autoDetect && (
            <div>
              Auto-detect: {autoDetect.recommended
                ? `recommended ${autoDetect.recommended}bpp from CGX size and SCR tile references (max tile ${autoDetect.maxTileIndex}, fits ${autoDetect.fits.join(', ')}bpp)`
                : `no safe CGX bit depth fit found from SCR tile references (max tile ${autoDetect.maxTileIndex})`}
            </div>
          )}
          <div>Palette values used: {scr.paletteUsage.join(', ') || 'none'}</div>
          <div>Priority values used: {scr.priorityUsage.join(', ') || 'none'}</div>
          <div>Horizontal flip values used: {scr.hFlipUsage.join(', ') || 'none'}</div>
          <div>Vertical flip values used: {scr.vFlipUsage.join(', ') || 'none'}</div>
          {scr.metadataBytes > 0 && <div>{scr.metadataBytes} metadata bytes after the first 8192 bytes</div>}
          {scr.trailerBytes > 0 && <div>{scr.trailerBytes} trailer bytes after the metadata region</div>}
          {scr.extraBytes > 0 && <div>{scr.extraBytes} extra bytes beyond the common 8960-byte size</div>}
          {scr.warnings.map((warning) => (
            <div key={warning} style={{ color: '#92400e' }}>
              {warning}
            </div>
          ))}
        </div>
      )}

      {cgx && (
        <div className="border border-gray-300 rounded p-3 bg-gray-50 space-y-1">
          <div className="font-medium">CGX Summary</div>
          <div>{cgx.tileCount} tiles at {cgx.bytesPerTile} bytes per tile</div>
          {cgx.warnings.map((warning) => (
            <div key={warning} style={{ color: '#92400e' }}>
              {warning}
            </div>
          ))}
        </div>
      )}

      {palette && (
        <div className="border border-gray-300 rounded p-3 bg-gray-50 space-y-2">
          <div className="font-medium">COL Summary</div>
          <div>{palette.rows.length} palette rows loaded</div>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {(palette.rows[0] || []).slice(0, 16).map((color, index) => (
              <div
                key={`${color.hex}-${index}`}
                title={`0x${color.hex}`}
                style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  background: color.rgbHex,
                  border: '1px solid #6b7280',
                }}
              />
            ))}
          </div>
        </div>
      )}

      {scr && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={downloadRenderedImage}
            style={{
              background: '#0f766e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              padding: '0.65rem 0.9rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Export Rendered PNG
          </button>
          <span style={{ color: '#4b5563' }}>
            Saves the current canvas view, including the selected block mode and palette mapping.
          </span>
        </div>
      )}

      {scr && (
        <div className="border border-gray-300 rounded p-3 bg-white overflow-auto">
          <canvas ref={canvasRef} />
        </div>
      )}
    </div>
  );
}

export default SnesScrViewer;
