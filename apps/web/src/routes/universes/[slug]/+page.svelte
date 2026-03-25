<script lang="ts">
import { UniverseStore } from 'loredata/browser';
import { untrack } from 'svelte';

import { GenerateBar } from '$features/generator';
import PersonaCard from '$features/persona/PersonaCard.svelte';
import UniverseSelector from '$features/universes/UniverseSelector.svelte';
import { preferences } from '$shared/preferences.svelte';

import type { PageData } from './$types';
import type { Person } from 'loredata/browser';

let { data }: { data: PageData } = $props();

const universe = $derived(data.universe);
const manifest = $derived(data.manifest);
const store = $derived(new UniverseStore([universe]));

const allInterests = $derived([...new Set(universe.characters.flatMap((c) => c.interests))].sort());

const allLocations = $derived([...new Set(universe.addresses.filter((a) => a.city).map((a) => a.city!))].sort());

const MAX_COUNT = 16;

let allPersonas = $state<Person[]>([...data.initialPersonas]);
let currentUniverseId = $state(data.universe.id);

const personas = $derived(allPersonas.slice(0, preferences.personaCount ?? 4));

$effect(() => {
	const id = universe.id;

	if (id === untrack(() => currentUniverseId)) {
		return;
	}

	currentUniverseId = id;
	allPersonas = data.initialPersonas;
});

function generate(): void {
	allPersonas = store.generatePersonas({}, MAX_COUNT);
}

function rerollOne(index: number): void {
	const current = allPersonas[index];

	if (!current) {
		return;
	}

	const fresh = store.personByCharacterId(current.characterId);

	allPersonas = allPersonas.map((p, i) => (i === index ? fresh : p));
}
</script>

<svelte:head>
	<title>{universe.name} fake personas — loredata</title>
	<meta
		name="description"
		content="Generate fake {universe.name} personas with realistic names, emails, addresses and more. {universe.description}" />
	<meta
		property="og:title"
		content="{universe.name} fake personas — loredata" />
	<meta
		property="og:description"
		content={universe.description} />
	<meta
		property="og:type"
		content="website" />
</svelte:head>

<div class="space-y-8 pt-4">
	<div class="space-y-2">
		<p class="text-surface-500 text-sm">
			<a
				href="/"
				class="hover:text-surface-300 transition-colors">loredata</a>
			<span class="mx-1">›</span>
			{universe.name}
		</p>
		<h1 class="h1 text-surface-950-50">{universe.name}</h1>
		<p class="text-surface-400 text-sm min-h-[3lh]">{universe.description}</p>
		<div class="flex gap-2 flex-wrap">
			{#each universe.genre as g (g)}
				<span class="badge preset-tonal-surface text-xs">{g}</span>
			{/each}
		</div>
	</div>

	<div class="space-y-2">
		<UniverseSelector
			universes={manifest}
			selectedId={universe.id} />
	</div>

	<div class="space-y-5">
		{#if allInterests.length > 0}
			<div class="space-y-2">
				<p class="text-surface-400 text-xs uppercase tracking-wide">Interests</p>
				<div class="flex flex-wrap gap-2">
					{#each allInterests as interest (interest)}
						<a
							href="/interests/{interest}"
							class="badge preset-tonal-surface transition-colors hover:preset-filled-primary-500">
							{interest}
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<GenerateBar ongenerate={generate} />
	</div>

	{#if personas.length > 0}
		<div
			class="grid gap-4 {(preferences.personaCount ?? 4) === 1 || personas.length === 1
				? 'grid-cols-1 max-w-lg'
				: 'grid-cols-1 sm:grid-cols-2'}">
			{#each personas as persona, i (i)}
				<PersonaCard
					persona={persona}
					onreroll={() => rerollOne(i)} />
			{/each}
		</div>
	{:else}
		<div class="card preset-tonal-surface p-12 text-center border border-surface-700/20">
			<p class="text-surface-400 text-sm">No characters match the selected filters.</p>
		</div>
	{/if}

	{#if allLocations.length > 0}
		<div class="space-y-2">
			<p class="text-surface-400 text-xs uppercase tracking-wide">Locations in this universe</p>
			<div class="flex flex-wrap gap-2">
				{#each allLocations as city (city)}
					<span class="badge preset-tonal-surface text-xs">{city}</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
