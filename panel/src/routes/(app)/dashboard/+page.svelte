<script lang="ts">
	import { env } from '$env/dynamic/public';
	import ServerCard from '$lib/components/server/ServerCard.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const baseDomain = env.PUBLIC_BASE_DOMAIN ?? 'example.com';
</script>

<svelte:head>
	<title>Dashboard - hosting-mc</title>
</svelte:head>

<div class="mx-auto max-w-2xl xl:max-w-4xl">
	<h1 class="text-2xl font-bold text-foreground">Your Servers</h1>

	{#if data.servers.length === 0}
		<div class="mt-6 flex flex-col items-center rounded-2xl border border-border bg-card px-4 py-14 text-center shadow-sm">
			<h2 class="text-lg font-semibold text-foreground">Create your first server</h2>
			<p class="mt-2 max-w-sm text-sm text-muted-foreground">
				Pick a name, choose a game type, and you are playing with your friends in under a minute.
			</p>
			<a
				href="/servers/new"
				class="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
			>
				<PlusIcon class="size-4" /> Create a server
			</a>
		</div>
	{:else}
		<div class="mt-6 grid gap-3 xl:grid-cols-2">
			{#each data.servers as server (server.id)}
				<ServerCard {server} address="{server.subdomain}.{baseDomain}" />
			{/each}
		</div>
	{/if}
</div>

<!-- floating create button (mobile) -->
<a
	href="/servers/new"
	aria-label="Create server"
	class="fixed bottom-20 left-4 z-40 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 md:hidden"
>
	<PlusIcon class="size-6" />
</a>
