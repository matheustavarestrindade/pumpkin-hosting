<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
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

<main class="mx-auto flex max-w-sm flex-col px-4 py-16 sm:py-24">
	<Card.Root>
		<Card.Header>
			<Card.Title>Log in</Card.Title>
			<Card.Description>Access your servers</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={submit} class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Label for="email">Email</Label>
					<Input id="email" type="email" bind:value={email} required autocomplete="email" />
				</div>
				<div class="flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<Label for="password">Password</Label>
						<a href="/forgot-password" class="text-xs text-primary hover:underline">Forgot password?</a>
					</div>
					<Input
						id="password"
						type="password"
						bind:value={password}
						required
						autocomplete="current-password"
					/>
				</div>
				{#if error}
					<p class="text-sm text-destructive">{error}</p>
				{/if}
				<Button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</Button>
			</form>
		</Card.Content>
	</Card.Root>
	<p class="mt-4 text-center text-sm text-muted-foreground">
		No account? <a href="/register" class="text-primary hover:underline">Sign up</a>
	</p>
</main>
