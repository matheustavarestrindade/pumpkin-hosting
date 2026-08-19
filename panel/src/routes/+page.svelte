<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Navbar from '$lib/components/ui/Navbar.svelte';

	const features = [
		{
			title: 'One click to online',
			desc: 'Pick a name, pick a game type, pay. Your server is live in under a minute.'
		},
		{
			title: 'Your own address',
			desc: 'Every server gets a clean address like steve.example.com. No ports, no IPs to remember.'
		},
		{
			title: 'Simple settings',
			desc: 'Difficulty, allowlist, game mode — a few switches, no config files, no wiki required.'
		},
		{
			title: 'Invite only friends',
			desc: 'Built-in allowlist. Only the people you add can join your world.'
		},
		{
			title: 'Download your world',
			desc: 'Your world is yours. Download a full copy anytime, even after you cancel.'
		},
		{
			title: 'Fair price',
			desc: 'Modern Rust server tech uses a fraction of the memory, so you pay a fraction of the price.'
		}
	];
</script>

<Navbar>
	{#snippet right()}
		<a href="/login" class="text-sm text-mc-muted hover:text-mc-text">Log in</a>
		<Button size="sm" onclick={() => (window.location.href = '/register')}>Sign up</Button>
	{/snippet}
</Navbar>

<main>
	<section class="mx-auto max-w-6xl px-4 py-24 text-center">
		<h1 class="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-mc-text">
			A Minecraft server for you and your friends, in one click
		</h1>
		<p class="mx-auto mt-4 max-w-xl text-lg text-mc-muted">
			No config files. No port forwarding. No command line. Pick a name and play.
		</p>
		<div class="mt-8 flex items-center justify-center gap-3">
			<Button onclick={() => (window.location.href = '/register')}>Create your server</Button>
			<Button variant="secondary" onclick={() => (window.location.href = '#pricing')}>See pricing</Button>
		</div>
		<p class="mt-6 font-mono text-sm text-mc-muted">
			your server address:
			<span class="rounded border border-mc-border bg-mc-surface px-2 py-1 text-mc-accent">steve.example.com</span>
		</p>
	</section>

	<section class="border-t border-mc-border">
		<div class="mx-auto grid max-w-6xl gap-4 px-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as f (f.title)}
				<Card>
					<h3 class="font-semibold text-mc-text">{f.title}</h3>
					<p class="mt-1.5 text-sm text-mc-muted">{f.desc}</p>
				</Card>
			{/each}
		</div>
	</section>

	<section id="pricing" class="border-t border-mc-border">
		<div class="mx-auto max-w-6xl px-4 py-16">
			<h2 class="text-center text-2xl font-bold text-mc-text">One plan. That's it.</h2>
			<p class="mt-2 text-center text-mc-muted">Everything you need to play with friends.</p>
			<Card class="mx-auto mt-8 max-w-sm">
				<div class="flex items-baseline justify-between">
					<h3 class="text-lg font-semibold text-mc-text">Friends</h3>
					<p class="text-mc-text"><span class="text-2xl font-bold">R$10</span> <span class="text-sm text-mc-muted">/month</span></p>
				</div>
				<ul class="mt-4 space-y-2 text-sm text-mc-muted">
					<li>Up to 10 players</li>
					<li>Custom address (yourexample.com)</li>
					<li>Survival, Creative, Hardcore or Flat</li>
					<li>Allowlist for your friends</li>
					<li>World download anytime</li>
					<li>Cancel anytime</li>
				</ul>
				<Button class="mt-6 w-full" onclick={() => (window.location.href = '/register')}>Get started</Button>
			</Card>
		</div>
	</section>
</main>

<footer class="border-t border-mc-border">
	<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-mc-muted">
		<span>hosting-mc</span>
		<span>Not affiliated with Mojang or Microsoft.</span>
	</div>
</footer>
