/**
 * Patch characters in universe data files.
 *
 * Usage:
 *   node --import tsx/esm scripts/patch-characters.ts
 *   node --import tsx/esm scripts/patch-characters.ts breaking-bad
 *
 * Patches are read from scripts/patch.json (gitignored).
 * Format:
 * {
 *   "breaking-bad": {
 *     "walter-white": { "symbol": "☢️" },
 *     "jesse-pinkman": { "symbol": "🎨", "profession": "artist" }
 *   }
 * }
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

import { formatJson } from './format-json';

import type { CharacterData } from '@/types/universe';

type CharacterPatch = Partial<Omit<CharacterData, 'id'>>;
type UniversePatches = Record<string, CharacterPatch>;
type InputFile = Record<string, UniversePatches>;

const SCRIPTS_DIR = import.meta.dirname;
const DATA_DIR = join(SCRIPTS_DIR, '../data');
const INPUT_PATH = join(SCRIPTS_DIR, 'patch.json');

function loadInput(): InputFile {
	if (!existsSync(INPUT_PATH)) {
		console.error(`input.json not found at ${INPUT_PATH}`);
		console.error('Create scripts/patch.json with patches to apply.');
		process.exit(1);
	}

	return JSON.parse(readFileSync(INPUT_PATH, 'utf-8')) as InputFile;
}

function patchUniverse(universeId: string, patches: UniversePatches): void {
	const filePath = join(DATA_DIR, universeId, 'characters.json');

	if (!existsSync(filePath)) {
		console.error(`  ✗ ${universeId}: characters.json not found`);

		return;
	}

	const characters = JSON.parse(readFileSync(filePath, 'utf-8')) as CharacterData[];

	let patchedCount = 0;

	const result = characters.map((char) => {
		const patch = patches[char.id];

		if (!patch) return char;

		patchedCount++;

		return { ...char, ...patch };
	});

	const missing = Object.keys(patches).filter((id) => !characters.some((c) => c.id === id));

	if (missing.length > 0) {
		console.warn(`  ⚠ ${universeId}: unknown character ids: ${missing.join(', ')}`);
	}

	writeFileSync(filePath, formatJson(result));
	console.log(`  ✓ ${universeId}: ${patchedCount} character(s) patched`);
}

function run(targetUniverse?: string): void {
	const input = loadInput();
	const universes = targetUniverse ? [targetUniverse] : Object.keys(input);

	for (const universeId of universes) {
		const patches = input[universeId];

		if (!patches) {
			console.error(`No patches defined for universe: ${universeId}`);
			process.exit(1);
		}

		patchUniverse(universeId, patches);
	}
}

run(process.argv[2]);
