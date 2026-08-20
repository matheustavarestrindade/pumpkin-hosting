<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import BlocksIcon from '@lucide/svelte/icons/blocks';

	let email = $state('');
	let loading = $state(false);
	let error = $state('');
	let sent = $state(false);

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;
		const res = await authClient.requestPasswordReset({
			email,
			redirectTo: '/reset-password'
		});
		loading = false;
		if (res.error) {
			error = res.error.message ?? 'Could not send the email';
			return;
		}
		sent = true;
	}
</script>

<svelte:head>
	<title>Reset password - hosting-mc</title>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="items-center text-center">
			<span class="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
				<BlocksIcon class="size-5" />
			</span>
			<Card.Title class="text-xl">Reset your password</Card.Title>
			<Card.Description>
				{sent ? 'Check your inbox' : 'We email you a reset link'}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if sent}
				<p class="text-center text-sm text-muted-foreground">
					If an account exists for <span class="font-medium text-foreground">{email}</span>, a reset
					link is on its way.
				</p>
			{:else}
				<form onsubmit={submit} class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label for="email">Email</Label>
						<Input id="email" type="email" bind:value={email} required />
					</div>
					{#if error}
						<p class="text-sm text-destructive">{error}</p>
					{/if}
					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? 'Sending...' : 'Send reset link'}
					</Button>
				</form>
			{/if}
			<p class="mt-4 text-center text-sm text-muted-foreground">
				Remembered it? <a href="/login" class="text-primary hover:underline">Sign in</a>
			</p>
		</Card.Content>
	</Card.Root>
</div>
