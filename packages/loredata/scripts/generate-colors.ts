/**
 * Generate avatar background colors for characters based on their emoji symbol.
 *
 * For each character with a `symbol` field, extracts the dominant fill colors
 * from the corresponding Twemoji SVG and computes a contrasting dark background.
 *
 * Usage:
 *   node --import tsx/esm scripts/generate-colors.ts
 *   node --import tsx/esm scripts/generate-colors.ts breaking-bad
 *   node --import tsx/esm scripts/generate-colors.ts --force
 *
 * Options:
 *   --force    Overwrite existing `color` values (default: skip if already set)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { createRequire, createRequire as createRequireForSvg } from 'module';
import { join, dirname } from 'path';

interface SvgColors {
	fills: { hex: () => string }[];
	strokes: { hex: () => string }[];
}

const getSvgColors: (svg: string) => SvgColors = createRequireForSvg(import.meta.url)('get-svg-colors');

import { formatJson } from './format-json';

import type { CharacterData } from '@/types/universe';

const require = createRequire(import.meta.url);
const TWEMOJI_DIR = dirname(require.resolve('@twemoji/svg/package.json')) + '/';
const SCRIPTS_DIR = import.meta.dirname;
const DATA_DIR = join(SCRIPTS_DIR, '../data');

function emojiToCodepoints(emoji: string): string[] {
	const codepoints: string[] = [];

	for (const char of [...emoji]) {
		const cp = char.codePointAt(0);

		if (cp === undefined) continue;

		codepoints.push(cp.toString(16));
	}

	return codepoints;
}

function findSvgPath(emoji: string): string | null {
	const cps = emojiToCodepoints(emoji);

	// Try progressively shorter sequences (ZWJ sequences may have multiple valid forms)
	// Also try with and without fe0f (variation selector)
	const sequences: string[] = [];

	// Full sequence
	sequences.push(cps.join('-'));
	// Without trailing fe0f
	const withoutVariation = cps.filter((cp) => cp !== 'fe0f');

	sequences.push(withoutVariation.join('-'));
	// Without all fe0f and 200d (ZWJ)
	const stripped = cps.filter((cp) => cp !== 'fe0f' && cp !== '200d');

	sequences.push(stripped.join('-'));
	// First codepoint only
	sequences.push(stripped[0] ?? cps[0] ?? '');

	for (const seq of sequences) {
		if (!seq) continue;

		const path = join(TWEMOJI_DIR, `${seq}.svg`);

		if (existsSync(path)) return path;
	}

	return null;
}

function hexToRgb(hex: string): [number, number, number] {
	const n = parseInt(hex.replace('#', ''), 16);

	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
	const [r, g, b] = hexToRgb(hex).map((c) => {
		const s = c / 255;

		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	});

	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
	const l1 = luminance(hex1);
	const l2 = luminance(hex2);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);

	return (lighter + 0.05) / (darker + 0.05);
}

// Wide palette: dark, medium, and some lighter saturated tones
const PALETTE = [
	// dark
	'#1e3a5f', // dark blue
	'#7f1d1d', // dark red
	'#064e3b', // dark emerald
	'#312e81', // dark indigo
	'#134e4a', // dark teal
	'#4c1d95', // dark violet
	'#7c2d12', // dark orange-brown
	'#083344', // dark cyan
	'#3b1f0a', // dark brown
	'#0c4a6e', // dark sky
	'#4a1942', // dark purple
	// medium
	'#1d4ed8', // blue-600
	'#0891b2', // cyan-600
	'#0284c7', // sky-600
	'#059669', // emerald-600
	'#7c3aed', // violet-600
	'#dc2626', // red-600
	'#d97706', // amber-600
	'#65a30d', // lime-600
	'#0d9488', // teal-600
	'#9333ea', // purple-600
	'#2563eb', // blue-600 alt
	'#16a34a', // green-600
	'#ea580c', // orange-600
	'#ca8a04', // yellow-600
	'#475569', // slate-600
	'#854d0e', // yellow-800
	'#166534' // green-800
];

function hashString(s: string): number {
	let h = 0;

	for (let i = 0; i < s.length; i++) {
		h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
	}

	return Math.abs(h);
}

function pickContrastColor(emojiColors: string[], characterId: string): string {
	if (emojiColors.length === 0) return PALETTE[hashString(characterId) % PALETTE.length];

	// collect all candidates passing minimum contrast threshold
	const passing: string[] = [];

	for (const candidate of PALETTE) {
		const contrasts = emojiColors.map((ec) => contrastRatio(candidate, ec));
		const minContrast = Math.min(...contrasts);

		if (minContrast >= 2.5) passing.push(candidate);
	}

	const pool = passing.length > 0 ? passing : PALETTE;

	// use character id hash to pick deterministically from the pool — ensures variety
	return pool[hashString(characterId) % pool.length];
}

function processUniverse(universeId: string, force: boolean): void {
	const filePath = join(DATA_DIR, universeId, 'characters.json');

	if (!existsSync(filePath)) {
		console.error(`  ✗ ${universeId}: characters.json not found`);

		return;
	}

	const characters = JSON.parse(readFileSync(filePath, 'utf-8')) as CharacterData[];
	let updatedCount = 0;
	let skippedCount = 0;

	const result = characters.map((char) => {
		if (!char.symbol) return char;
		if (char.color && !force) {
			skippedCount++;

			return char;
		}

		const svgPath = findSvgPath(char.symbol);

		if (!svgPath) {
			console.warn(`  ⚠ ${universeId}/${char.id}: SVG not found for ${char.symbol}`);

			return char;
		}

		const svg = readFileSync(svgPath, 'utf-8');
		const { fills } = getSvgColors(svg);
		const hexColors = fills.map((c) => c.hex()).filter((h) => h !== 'none' && h !== '#000000' && h !== '#ffffff');

		const color = pickContrastColor(hexColors, char.id);

		updatedCount++;

		return { ...char, color };
	});

	writeFileSync(filePath, formatJson(result));
	console.log(`  ✓ ${universeId}: ${updatedCount} updated, ${skippedCount} skipped`);
}

function run(): void {
	const args = process.argv.slice(2);
	const force = args.includes('--force');
	const universeArg = args.find((a) => !a.startsWith('--'));

	const universes = universeArg
		? [universeArg]
		: readdirSync(DATA_DIR, { withFileTypes: true })
				.filter((e) => e.isDirectory())
				.map((e) => e.name);

	for (const universeId of universes) {
		processUniverse(universeId, force);
	}
}

run();
