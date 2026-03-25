const STORAGE_KEY = 'preferences';

interface Preferences {
	personaCount: number | null;
}

function readStorage(): number | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const parsed: unknown = raw ? JSON.parse(raw) : null;
		const count =
			parsed !== null && typeof parsed === 'object' && 'personaCount' in parsed
				? (parsed as Record<string, unknown>).personaCount
				: null;

		return typeof count === 'number' ? count : null;
	} catch {
		return null;
	}
}

function writeStorage(personaCount: number): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify({ personaCount }));
}

const prefs: Preferences = $state({ personaCount: null });

export const preferences = {
	get personaCount(): number | null {
		return prefs.personaCount;
	},
	init(): void {
		prefs.personaCount = readStorage() ?? 4;
	},
	set personaCount(value: number) {
		prefs.personaCount = value;
		writeStorage(value);
	}
};
