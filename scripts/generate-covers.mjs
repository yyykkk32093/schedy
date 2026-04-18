#!/usr/bin/env node
/**
 * デフォルトカバー画像生成スクリプト（使い捨て）
 *
 * SVG フォーマットで自然系グラデーション画像を10種生成する。
 * 出力先: frontend/public/images/default-covers/cover-01.svg 〜 cover-10.svg
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../frontend/public/images/default-covers')

const WIDTH = 1200
const HEIGHT = 400

/**
 * 10種の自然系配色テーマ
 * 各テーマは複数のグラデーション stop を持ち、自然な色合いを再現
 */
const themes = [
    {
        name: 'ocean',
        stops: [
            { offset: 0, color: '#0f4c75' },
            { offset: 50, color: '#3282b8' },
            { offset: 100, color: '#bbe1fa' },
        ],
        angle: 135,
    },
    {
        name: 'sunset',
        stops: [
            { offset: 0, color: '#e44d26' },
            { offset: 40, color: '#f09819' },
            { offset: 100, color: '#ffd89b' },
        ],
        angle: 160,
    },
    {
        name: 'forest',
        stops: [
            { offset: 0, color: '#134e5e' },
            { offset: 50, color: '#2d8659' },
            { offset: 100, color: '#71b280' },
        ],
        angle: 120,
    },
    {
        name: 'dawn',
        stops: [
            { offset: 0, color: '#5b2c6f' },
            { offset: 50, color: '#cb6699' },
            { offset: 100, color: '#ffd1dc' },
        ],
        angle: 145,
    },
    {
        name: 'lavender',
        stops: [
            { offset: 0, color: '#2c3e50' },
            { offset: 50, color: '#8e44ad' },
            { offset: 100, color: '#d2b4de' },
        ],
        angle: 130,
    },
    {
        name: 'aurora',
        stops: [
            { offset: 0, color: '#0b3d4e' },
            { offset: 35, color: '#1a6b4b' },
            { offset: 70, color: '#44c0a7' },
            { offset: 100, color: '#b5f5ec' },
        ],
        angle: 150,
    },
    {
        name: 'desert',
        stops: [
            { offset: 0, color: '#8b4513' },
            { offset: 50, color: '#d2691e' },
            { offset: 100, color: '#f4e3c1' },
        ],
        angle: 140,
    },
    {
        name: 'twilight',
        stops: [
            { offset: 0, color: '#0f0c29' },
            { offset: 50, color: '#302b63' },
            { offset: 100, color: '#24243e' },
        ],
        angle: 160,
    },
    {
        name: 'meadow',
        stops: [
            { offset: 0, color: '#56ab2f' },
            { offset: 50, color: '#7bc67e' },
            { offset: 100, color: '#d4fc79' },
        ],
        angle: 125,
    },
    {
        name: 'coral',
        stops: [
            { offset: 0, color: '#c0392b' },
            { offset: 50, color: '#e08283' },
            { offset: 100, color: '#ffecd2' },
        ],
        angle: 155,
    },
]

function angleToCoords(angle) {
    const rad = ((angle - 90) * Math.PI) / 180
    const x2 = Math.round((Math.cos(rad) + 1) / 2 * 100)
    const y2 = Math.round((Math.sin(rad) + 1) / 2 * 100)
    const x1 = 100 - x2
    const y1 = 100 - y2
    return { x1: `${x1}%`, y1: `${y1}%`, x2: `${x2}%`, y2: `${y2}%` }
}

function generateSvg(theme) {
    const { x1, y1, x2, y2 } = angleToCoords(theme.angle)
    const stops = theme.stops
        .map((s) => `      <stop offset="${s.offset}%" stop-color="${s.color}" />`)
        .join('\n')

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="grad" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
${stops}
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grad)" />
</svg>
`
}

for (let i = 0; i < themes.length; i++) {
    const num = String(i + 1).padStart(2, '0')
    const svg = generateSvg(themes[i])
    const path = resolve(outDir, `cover-${num}.svg`)
    writeFileSync(path, svg, 'utf-8')
    console.log(`✅ cover-${num}.svg (${themes[i].name})`)
}

console.log(`\nDone — ${themes.length} covers generated in ${outDir}`)
