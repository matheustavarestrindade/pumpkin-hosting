<script lang="ts">
	import type { serverStatus } from '$lib/server/db/schema';

	type Status = (typeof serverStatus.enumValues)[number];

	type Props = {
		status: Status;
	};

	let { status }: Props = $props();

	const colors: Record<Status, string> = {
		running: 'bg-green-500',
		provisioning: 'bg-yellow-500 animate-pulse',
		starting: 'bg-yellow-500 animate-pulse',
		stopping: 'bg-yellow-500 animate-pulse',
		stopped: 'bg-mc-muted',
		error: 'bg-red-500',
		suspended: 'bg-red-500'
	};
</script>

<span class="inline-block size-2.5 rounded-full {colors[status]}" title={status}></span>
