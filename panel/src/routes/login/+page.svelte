<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Navbar from '$lib/components/ui/Navbar.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;
		const { error: err } = await authClient.signIn.email({ email, password });
		loading = false;
		if (err) {
			error = err.message ?? 'Login failed';
			return;
		}
		goto('/dashboard');
	}
</script>

<Navbar />

<main class="mx-auto flex max-w-sm flex-col px-4 py-24">
	<Card>
		<h1 class="text-lg font-semibold text-mc-text">Log in</h1>
		<form onsubmit={submit} class="mt-4 flex flex-col gap-4">
			<Input label="Email" type="email" bind:value={email} required autocomplete="email" />
			<Input
				label="Password"
				type="password"
				bind:value={password}
				required
				autocomplete="current-password"
			/>
			{#if error}
				<p class="text-sm text-red-400">{error}</p>
			{/if}
			<Button type="submit" {loading}>Log in</Button>
		</form>
	</Card>
	<p class="mt-4 text-center text-sm text-mc-muted">
		No account? <a href="/register" class="text-mc-accent hover:underline">Sign up</a>
	</p>
</main>
