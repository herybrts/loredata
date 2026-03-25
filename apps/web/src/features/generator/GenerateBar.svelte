<script lang="ts">
import CountSelector from './CountSelector.svelte';
import GenerateButton from './GenerateButton.svelte';

interface Props {
	ongenerate: () => void;
	oncount?: (count: number) => void;
	loading?: boolean;
}

let { ongenerate, oncount, loading = false }: Props = $props();
</script>

<div class="flex items-center justify-between">
	<CountSelector onchange={oncount} />
	<GenerateButton
		onclick={ongenerate}
		loading={loading} />
</div>
