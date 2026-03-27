<script lang="ts">
import '../app.css';

import AppSidebar from '$layouts/AppSidebar.svelte';
import SocialBar from '$layouts/SocialBar.svelte';

import type { LayoutData } from './$types';
import type { Snippet } from 'svelte';

let { children, data }: { children: Snippet; data: LayoutData } = $props();
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
	<div class="flex gap-8 items-start">
		<AppSidebar
			universes={data.manifest}
			characterIndex={data.characterIndex} />
		<main class="min-w-0 flex-1">
			{@render children()}
		</main>
	</div>
</div>
<SocialBar />
