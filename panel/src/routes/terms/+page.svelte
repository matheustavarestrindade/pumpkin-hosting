<script lang="ts">
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import * as m from '$lib/paraglide/messages';

	const sections = $derived([
		{ t: m.legal_t1_t(), b: m.legal_t1_b() },
		{ t: m.legal_t2_t(), b: m.legal_t2_b() },
		{ t: m.legal_t3_t(), b: m.legal_t3_b() },
		{ t: m.legal_t4_t(), b: m.legal_t4_b() },
		{ t: m.legal_t5_t(), b: m.legal_t5_b() },
		{ t: m.legal_t6_t(), b: m.legal_t6_b() },
		{ t: m.legal_t7_t(), b: m.legal_t7_b() },
		{ t: m.legal_t8_t(), b: m.legal_t8_b() }
	]);
</script>

<svelte:head>
	<title>{m.legal_terms_title()} - hosting-mc</title>
</svelte:head>

<Navbar />

<main class="mx-auto max-w-2xl px-4 py-12">
	<h1 class="text-2xl font-bold text-foreground">{m.legal_terms_title()}</h1>
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
