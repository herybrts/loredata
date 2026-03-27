import { UniverseLoader } from 'loredata';

import type { CharacterIndexEntry } from '$shared/types';
import type { LayoutServerLoad } from './$types';

export const prerender = true;

export const load: LayoutServerLoad = () => {
	const manifest = UniverseLoader.getManifest();

	const characterIndex: CharacterIndexEntry[] = [];

	for (const meta of manifest) {
		const universe = UniverseLoader.load(meta.id);

		for (const character of universe.characters) {
			characterIndex.push({
				characterId: character.id,
				universeId: universe.id,
				universeName: universe.name,
				firstName: character.firstName ?? '',
				lastName: character.lastName ?? ''
			});
		}
	}

	return { manifest, characterIndex };
};
