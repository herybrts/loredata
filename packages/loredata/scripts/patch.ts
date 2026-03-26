/**
 * Patch universe data files.
 *
 * Usage:
 *   node --import tsx/esm scripts/patch.ts chars
 *   node --import tsx/esm scripts/patch.ts chars breaking-bad
 *   node --import tsx/esm scripts/patch.ts meta
 *   node --import tsx/esm scripts/patch.ts meta breaking-bad
 *
 * Patches are read from scripts/patch.json (gitignored).
 *
 * Format for chars:
 * {
 *   "breaking-bad": {
 *     "walter-white": { "symbol": "☢️" },
 *     "jesse-pinkman": { "symbol": "🎨", "profession": "artist" }
 *   }
 * }
 *
 * Format for meta:
 * {
 *   "breaking-bad": { "mediaType": "tv" },
 *   "matrix": { "mediaType": "movie" }
 * }
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

import { formatJson } from './format-json';

import type { CharacterData } from '@/types/universe';

type CharsPatch = Record<string, Partial<Omit<CharacterData, 'id'>>>;
type MetaPatch = Record<string, unknown>;
type InputFile = Record<string, CharsPatch | MetaPatch>;

const SCRIPTS_DIR = import.meta.dirname;
const DATA_DIR = join(SCRIPTS_DIR, '../data');
const INPUT_PATH = join(SCRIPTS_DIR, 'patch.json');

class Patcher {
	private input: InputFile;

	constructor() {
		if (!existsSync(INPUT_PATH)) {
			console.error(`patch.json not found at ${INPUT_PATH}`);
			console.error('Create scripts/patch.json with patches to apply.');
			process.exit(1);
		}

		this.input = JSON.parse(readFileSync(INPUT_PATH, 'utf-8')) as InputFile;
	}

	chars(targetUniverse?: string): void {
		const universes = targetUniverse ? [targetUniverse] : Object.keys(this.input);

		for (const universeId of universes) {
			const patches = this.input[universeId] as CharsPatch | undefined;

			if (!patches) {
				console.error(`No patches defined for universe: ${universeId}`);
				process.exit(1);
			}

			this.patchChars(universeId, patches);
		}
	}

	meta(targetUniverse?: string): void {
		const universes = targetUniverse ? [targetUniverse] : Object.keys(this.input);

		for (const universeId of universes) {
			const patch = this.input[universeId] as MetaPatch | undefined;

			if (!patch) {
				console.error(`No patches defined for universe: ${universeId}`);
				process.exit(1);
			}

			this.patchMeta(universeId, patch);
		}
	}

	private patchChars(universeId: string, patches: CharsPatch): void {
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

	private patchMeta(universeId: string, patch: MetaPatch): void {
		const filePath = join(DATA_DIR, universeId, 'meta.json');

		if (!existsSync(filePath)) {
			console.error(`  ✗ ${universeId}: meta.json not found`);

			return;
		}

		const meta = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;

		writeFileSync(filePath, formatJson({ ...meta, ...patch }));
		console.log(`  ✓ ${universeId}`);
	}
}

const [mode, universe] = process.argv.slice(2);
const patcher = new Patcher();

if (mode === 'chars') {
	patcher.chars(universe);
} else if (mode === 'meta') {
	patcher.meta(universe);
} else {
	console.error('Usage: patch.ts <chars|meta> [universe-id]');
	process.exit(1);
}
