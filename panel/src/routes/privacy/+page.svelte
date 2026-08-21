<script lang="ts">
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import * as m from '$lib/paraglide/messages';

	const sections = $derived([
		{ t: m.legal_p1_t(), b: m.legal_p1_b() },
		{ t: m.legal_p2_t(), b: m.legal_p2_b() },
		{ t: m.legal_p3_t(), b: m.legal_p3_b() },
		{ t: m.legal_p4_t(), b: m.legal_p4_b() },
		{ t: m.legal_p5_t(), b: m.legal_p5_b() },
		{ t: m.legal_p6_t(), b: m.legal_p6_b() },
		{ t: m.legal_p7_t(), b: m.legal_p7_b() }
	]);
</script>

<svelte:head>
	<title>{m.legal_privacy_title()} - hosting-mc</title>
</svelte:head>

<Navbar />

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="text-2xl font-bold text-foreground">{m.legal_privacy_title()}</h1>
	<p class="mt-1 text-sm text-muted-foreground">{m.legal_updated({ date: '2026-08-21' })}</p>
	<div class="mt-8 flex flex-col gap-6">
		{#each sections as s (s.t)}
			<section>
				<h2 class="font-semibold text-foreground">{s.t}</h2>
				<p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.b}</p>
			</section>
		{/each}
	</div>
</main>
