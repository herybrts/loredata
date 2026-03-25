<script lang="ts">
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();

const { interests } = data;
</script>

<svelte:head>
	<title>All interests — loredata</title>
	<meta
		name="description"
		content="Browse all interests across pop culture universes: Breaking Bad, Game of Thrones, Harry Potter and more." />
	<meta
		property="og:title"
		content="All interests — loredata" />
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
			interests
		</p>
		<h1 class="h1 text-surface-950-50">All interests</h1>
		<p class="text-surface-400 text-sm">{interests.length} interests across all universes</p>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each interests as interest (interest)}
			<a
				href="/interests/{interest}"
				class="badge preset-tonal-surface hover:preset-filled-primary-500 transition-colors">
				{interest}
			</a>
		{/each}
	</div>
</div>
