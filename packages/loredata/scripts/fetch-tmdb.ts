/**
 * Fetch TMDB metadata and write it directly into meta.json files.
 *
 * For each universe with a tmdbId, queries TMDB and writes year, tmdbRating,
 * networks, posterPath, backdropPath into the existing meta.json — preserving
 * all other fields.
 *
 * Usage:
 *   TMDB_API_KEY=<token> node --import tsx/esm scripts/fetch-tmdb.ts
 *   TMDB_API_KEY=<token> node --import tsx/esm scripts/fetch-tmdb.ts breaking-bad
 *
 * Set TMDB_API_KEY to a Read Access Token (Bearer) from tmdb.org → Settings → API.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

import { formatJson } from './format-json';

const SCRIPTS_DIR = import.meta.dirname;
const DATA_DIR = join(SCRIPTS_DIR, '../data');
const TMDB_BASE = 'https://api.themoviedb.org/3';

interface UniverseMeta {
	id: string;
	name: string;
	tmdbId?: number;
	mediaType?: 'tv' | 'movie';
	[key: string]: unknown;
}

interface TmdbTvResult {
	first_air_date: string;
	vote_average: number;
	poster_path: string | null;
	backdrop_path: string | null;
	networks: { name: string }[];
}

interface TmdbMovieResult {
	release_date: string;
	vote_average: number;
	poster_path: string | null;
	backdrop_path: string | null;
	production_companies: { name: string }[];
}

const API_KEY = process.env.TMDB_API_KEY;

if (!API_KEY) {
	console.error('Error: TMDB_API_KEY is not set.');
	console.error('Get a Read Access Token at https://www.themoviedb.org/settings/api');
	process.exit(1);
}

function getUniverseIds(filter?: string): string[] {
	if (filter) return [filter];

	return readdirSync(DATA_DIR, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name);
}

async function fetchJson<T>(url: string): Promise<T> {
	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' }
	});

	if (!response.ok) {
		throw new Error(`TMDB ${response.status} ${response.statusText} — ${url}`);
	}

	return response.json() as Promise<T>;
}

async function syncUniverse(metaPath: string, meta: UniverseMeta): Promise<void> {
	const type = meta.mediaType ?? 'tv';
	const url = `${TMDB_BASE}/${type}/${meta.tmdbId}`;

	let year: number | undefined;
	let rating: number | undefined;
	let networks: string[] | undefined;
	let posterPath: string | null = null;
	let backdropPath: string | null = null;

	if (type === 'tv') {
		const data = await fetchJson<TmdbTvResult>(url);

		year = data.first_air_date ? Number(data.first_air_date.slice(0, 4)) : undefined;
		rating = Math.round(data.vote_average * 10) / 10;
		networks = data.networks.map((n) => n.name);
		posterPath = data.poster_path;
		backdropPath = data.backdrop_path;
	} else {
		const data = await fetchJson<TmdbMovieResult>(url);

		year = data.release_date ? Number(data.release_date.slice(0, 4)) : undefined;
		rating = Math.round(data.vote_average * 10) / 10;
		networks = data.production_companies.map((c) => c.name);
		posterPath = data.poster_path;
		backdropPath = data.backdrop_path;
	}

	const updated: UniverseMeta = {
		id: meta.id,
		name: meta.name,
		genre: meta.genre,
		description: meta.description,
		tmdbId: meta.tmdbId,
		...(meta.mediaType !== undefined && { mediaType: meta.mediaType }),
		...(year !== undefined && { year }),
		rating,
		...(networks && networks.length > 0 && { networks }),
		...(posterPath && { posterPath }),
		...(backdropPath && { backdropPath })
	};

	writeFileSync(metaPath, formatJson(updated));
	console.log(`✓ ${meta.id}`);
}

async function main(): Promise<void> {
	const universeArg = process.argv[2];
	const ids = getUniverseIds(universeArg);
	const toSync: { path: string; meta: UniverseMeta }[] = [];

	for (const id of ids) {
		const metaPath = join(DATA_DIR, id, 'meta.json');

		if (!existsSync(metaPath)) continue;

		const meta = JSON.parse(readFileSync(metaPath, 'utf-8')) as UniverseMeta;

		if (!meta.tmdbId) {
			console.log(`skip ${id} — no tmdbId`);
			continue;
		}

		toSync.push({ path: metaPath, meta });
	}

	if (toSync.length === 0) {
		console.log('No universes with tmdbId found.');
		process.exit(0);
	}

	console.log(`Syncing ${toSync.length} universe(s) from TMDB...\n`);

	for (const { path, meta } of toSync) {
		try {
			await syncUniverse(path, meta);
		} catch (err) {
			console.error(`✗ ${meta.id}: ${err instanceof Error ? err.message : String(err)}`);
		}
	}
}

await main();
