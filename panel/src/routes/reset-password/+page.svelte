<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import BlocksIcon from '@lucide/svelte/icons/blocks';

	const token = $derived(page.url.searchParams.get('token') ?? '');

	let password = $state('');
	let confirm = $state('');
	let loading = $state(false);
	let error = $state('');

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}
		if (password !== confirm) {
			error = 'Passwords do not match';
			return;
		}
		loading = true;
		const res = await authClient.resetPassword({ newPassword: password, token });
		loading = false;
		if (res.error) {
			error = res.error.message ?? 'Reset failed - the link may have expired';
			return;
		}
		goto('/login');
	}
</script>

<svelte:head>
	<title>New password - hosting-mc</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="items-center text-center">
			<span class="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
				<BlocksIcon class="size-5" />
			</span>
			<Card.Title class="text-xl">Choose a new password</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if !token}
				<p class="text-center text-sm text-destructive">
					This reset link is invalid. Request a new one.
				</p>
				<Button href="/forgot-password" class="mt-4 w-full">Request new link</Button>
			{:else}
				<form onsubmit={submit} class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label for="password">New password</Label>
						<Input id="password" type="password" bind:value={password} required minlength={8} />
					</div>
					<div class="flex flex-col gap-2">
						<Label for="confirm">Confirm password</Label>
						<Input id="confirm" type="password" bind:value={confirm} required minlength={8} />
					</div>
					{#if error}
						<p class="text-sm text-destructive">{error}</p>
					{/if}
					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? 'Saving...' : 'Save new password'}
					</Button>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
