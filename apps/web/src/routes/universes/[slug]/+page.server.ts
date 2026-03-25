import { error } from '@sveltejs/kit';
import { UniverseLoader, PersonFactory } from 'loredata';

import type { PageServerLoad, EntryGenerator } from './$types';
import type { Person, UniverseData } from 'loredata';

const INITIAL_PERSONA_COUNT = 16;

export const prerender = true;

export const entries: EntryGenerator = () => {
	const ids = UniverseLoader.listAvailable();

	return ids.map((id) => ({ slug: id }));
};

export const load: PageServerLoad = ({ params }) => {
	const ids = UniverseLoader.listAvailable();

	if (!ids.includes(params.slug)) {
		error(404, `Universe "${params.slug}" not found`);
	}

	const universe = UniverseLoader.load(params.slug);

	const topCharacterIds = universe.characters.slice(0, INITIAL_PERSONA_COUNT).map((c) => c.id);
	const initialPersonas: Person[] = topCharacterIds.map((id) => PersonFactory.buildCanonical(id, universe));

	const data: { universe: UniverseData; initialPersonas: Person[] } = { universe, initialPersonas };

	return data;
};
