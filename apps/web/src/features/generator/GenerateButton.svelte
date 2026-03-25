<script lang="ts">
interface Props {
	onclick: () => void;
	loading?: boolean;
}

let { onclick, loading = false }: Props = $props();
</script>

<button
	class="btn preset-filled-primary-500"
	onclick={onclick}
	disabled={loading}>
	{loading ? 'Loading…' : 'Generate'}
</button>
