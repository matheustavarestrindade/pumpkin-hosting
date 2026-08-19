<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Navbar from '$lib/components/ui/Navbar.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;
		const { error: err } = await authClient.signUp.email({ name, email, password });
		loading = false;
		if (err) {
			error = err.message ?? 'Signup failed';
			return;
		}
		goto('/dashboard');
	}
</script>

<Navbar />

<main class="mx-auto flex max-w-sm flex-col px-4 py-24">
	<Card>
		<h1 class="text-lg font-semibold text-mc-text">Create your account</h1>
		<form onsubmit={submit} class="mt-4 flex flex-col gap-4">
			<Input label="Name" bind:value={name} required autocomplete="name" />
			<Input label="Email" type="email" bind:value={email} required autocomplete="email" />
			<Input
				label="Password"
				type="password"
				bind:value={password}
				required
				minlength={8}
				autocomplete="new-password"
			/>
			{#if error}
				<p class="text-sm text-red-400">{error}</p>
			{/if}
			<Button type="submit" {loading}>Sign up</Button>
		</form>
	</Card>
	<p class="mt-4 text-center text-sm text-mc-muted">
		Already have an account? <a href="/login" class="text-mc-accent hover:underline">Log in</a>
	</p>
</main>
