import { UniverseLoader, PersonFactory } from 'loredata';

import type { PageServerLoad } from './$types';
import type { Person } from 'loredata';

const INITIAL_PERSONA_COUNT = 4;

export const prerender = true;

export const load: PageServerLoad = () => {
	const ids = UniverseLoader.listAvailable();
	const firstId = ids[0];

	if (!firstId) {
		return { initialPersonas: [], initialUniverseId: null };
	}

	const universe = UniverseLoader.load(firstId);

	const topCharacterIds = universe.characters.slice(0, INITIAL_PERSONA_COUNT).map((c) => c.id);
	const initialPersonas: Person[] = topCharacterIds.map((id) => PersonFactory.buildCanonical(id, universe));

	return { initialPersonas, initialUniverseId: firstId };
};
