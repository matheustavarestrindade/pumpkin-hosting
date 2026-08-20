<script lang="ts">
	import { env } from '$env/dynamic/public';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import ServerCard from '$lib/components/server/ServerCard.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const baseDomain = env.PUBLIC_BASE_DOMAIN ?? 'example.com';
</script>

<svelte:head>
	<title>Dashboard - hosting-mc</title>
</svelte:head>

<div class="flex items-center justify-between">
	<div>
		<h1 class="text-xl font-bold text-foreground">Your servers</h1>
		<p class="mt-0.5 text-sm text-muted-foreground">
			{data.servers.length === 0 ? 'No servers yet' : `${data.servers.length} server${data.servers.length > 1 ? 's' : ''}`}
		</p>
	</div>
	<Button href="/servers/new">
		<PlusIcon /> New server
	</Button>
</div>

{#if data.servers.length === 0}
	<Card.Root class="mt-8">
		<Card.Content class="flex flex-col items-center py-14 text-center">
			<h2 class="text-lg font-semibold text-foreground">Create your first server</h2>
			<p class="mt-2 max-w-sm text-sm text-muted-foreground">
				Pick a name, choose a game type, and you are playing with your friends in under a minute.
			</p>
			<Button class="mt-6" href="/servers/new">
				<PlusIcon /> Create a server
			</Button>
		</Card.Content>
	</Card.Root>
{:else}
	<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each data.servers as server (server.id)}
			<ServerCard {server} address="{server.subdomain}.{baseDomain}" />
		{/each}
	</div>
{/if}
