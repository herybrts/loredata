<script lang="ts">
import '../app.css';

import { onMount } from 'svelte';

import AppSidebar from '$layouts/AppSidebar.svelte';
import SocialBar from '$layouts/SocialBar.svelte';

import type { LayoutData } from './$types';
import type { Snippet } from 'svelte';

let { children, data }: { children: Snippet; data: LayoutData } = $props();

onMount(() => {
	if (window.location.hostname !== 'loredata.orchidfiles.com') return;
	const script = document.createElement('script');
	script.defer = true;
	script.src = 'https://analytics.orchidfiles.com/script.js';
	script.dataset.websiteId = '30a8c08e-08c9-4bca-8326-916a88a3d274';
	document.head.appendChild(script);
});
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
