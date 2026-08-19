<script lang="ts">
	import { env } from '$env/dynamic/public';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import ServerCard from '$lib/components/server/ServerCard.svelte';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const baseDomain = env.PUBLIC_BASE_DOMAIN ?? 'example.com';
</script>

<svelte:head>
	<title>Dashboard - hosting-mc</title>
</svelte:head>

<div class="flex items-center justify-between">
	<h1 class="text-xl font-bold text-mc-text">Your servers</h1>
	<Button onclick={() => goto('/servers/new')}>New server</Button>
</div>

{#if data.servers.length === 0}
	<Card class="mt-8 flex flex-col items-center py-16 text-center">
		<h2 class="text-lg font-semibold text-mc-text">Create your first server</h2>
		<p class="mt-2 max-w-sm text-sm text-mc-muted">
			Pick a name, choose a game type, and you are playing with your friends in under a minute.
		</p>
		<Button class="mt-6" onclick={() => goto('/servers/new')}>Create a server</Button>
	</Card>
{:else}
	<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.servers as server (server.id)}
			<ServerCard {server} address="{server.subdomain}.{baseDomain}" />
		{/each}
	</div>
{/if}
