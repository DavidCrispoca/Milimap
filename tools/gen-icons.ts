/**
 * Generate the PWA icons (Phase 8).
 *
 * Renders a navy square with a gold diamond ring — the Milimap mark — as PNGs in
 * the sizes installable apps need (192, 512, 180 apple-touch-icon). Written from
 * scratch with a minimal PNG encoder (zlib from node:zlib) so the repo has no
 * image tooling dependency and the icons are reproducible.
 *
 * Run: `npm run gen:icons`
 */

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/icons')

// Institutional palette (src/styles/tokens.css).
const NAVY: [number, number, number] = [0x11, 0x23, 0x58]
const GOLD: [number, number, number] = [0xfc, 0xc4, 0x00]

interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

function renderIcon(size: number, outerRatio: number, innerRatio: number): Buffer {
  const center = size / 2
  const outer = size * outerRatio
  const inner = size * innerRatio

  const pixels: Rgba[] = new Array(size * size)
  let index = 0
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dist = Math.abs(x - center) + Math.abs(y - center)
      const color = dist <= inner ? NAVY : dist <= outer ? GOLD : NAVY
      pixels[index] = { r: color[0], g: color[1], b: color[2], a: 255 }
      index += 1
    }
  }
  return encodePng(size, size, pixels)
}

/* ------------------------------------------------------------------ */
/* Minimal PNG encoder (8-bit RGBA, no interlace, no filtering).       */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBytes = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0)
  return Buffer.concat([length, typeBytes, data, crc])
}

function encodePng(width: number, height: number, pixels: Rgba[]): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  // Raw scanlines, each prefixed with filter type 0.
  const raw = Buffer.alloc(height * (1 + width * 4))
  let offset = 0
  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0
    offset += 1
    for (let x = 0; x < width; x += 1) {
      const pixel = pixels[y * width + x] as Rgba
      raw[offset] = pixel.r
      raw[offset + 1] = pixel.g
      raw[offset + 2] = pixel.b
      raw[offset + 3] = pixel.a
      offset += 4
    }
  }

  const idat = deflateSync(raw)
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* ------------------------------------------------------------------ */

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true })

  const targets: Array<{ file: string; size: number; outer: number; inner: number }> = [
    { file: 'icon-192.png', size: 192, outer: 0.42, inner: 0.28 },
    { file: 'icon-512.png', size: 512, outer: 0.42, inner: 0.28 },
    { file: 'apple-touch-icon.png', size: 180, outer: 0.42, inner: 0.28 },
    // Maskable icons need extra safe padding around the mark.
    { file: 'icon-192-maskable.png', size: 192, outer: 0.32, inner: 0.2 },
    { file: 'icon-512-maskable.png', size: 512, outer: 0.32, inner: 0.2 },
  ]

  for (const target of targets) {
    const png = renderIcon(target.size, target.outer, target.inner)
    writeFileSync(resolve(OUT_DIR, target.file), png)
    console.log(`wrote ${target.file} (${png.length} bytes)`)
  }
}

main()
