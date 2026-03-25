<script lang="ts">
import { onMount } from 'svelte';

import { preferences } from '$shared/preferences.svelte';

const COUNTS = [1, 4, 8, 16] as const;

interface Props {
	onchange?: (count: number) => void;
}

let { onchange }: Props = $props();

onMount(() => {
	preferences.init();
});

function select(count: number): void {
	preferences.personaCount = count;
	onchange?.(count);
}
</script>

<div class="btn-group">
	{#each COUNTS as count (count)}
		<button
			class="btn btn-sm {preferences.personaCount === count ? 'preset-filled-primary-500' : 'preset-tonal-surface'}"
			onclick={() => select(count)}>
			{count}
		</button>
	{/each}
</div>
