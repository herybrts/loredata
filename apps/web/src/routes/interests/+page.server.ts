import { UniverseLoader } from 'loredata';

import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = () => {
	const interests = UniverseLoader.getAllInterests();

	return { interests };
};
