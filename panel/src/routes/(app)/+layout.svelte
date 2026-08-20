<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	async function logout() {
		await authClient.signOut();
		goto('/');
	}
</script>

<Navbar>
	{#snippet right()}
		<span class="hidden text-sm text-muted-foreground sm:inline">{data.user.email}</span>
		<Button variant="ghost" size="sm" onclick={logout}>Log out</Button>
	{/snippet}
</Navbar>

<main class="mx-auto max-w-6xl px-4 py-6 sm:py-8">
	{@render children()}
</main>
