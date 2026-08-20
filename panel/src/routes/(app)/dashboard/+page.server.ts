import { agent } from '$lib/server/agent';
import { db } from '$lib/server/db';
import { nodes, servers } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const rows = await db
		.select({ server: servers, node: nodes })
		.from(servers)
		.innerJoin(nodes, eq(nodes.id, servers.nodeId))
		.where(eq(servers.userId, user.id))
		.orderBy(desc(servers.createdAt));

	// Enrich with live container state (sleeping = running but container stopped).
	// Best-effort: agent unreachable -> DB status only.
	const list = await Promise.all(
		rows.map(async ({ server, node }) => {
			let containerStatus: string | null = null;
			try {
				containerStatus = (await agent.serverStatus(node, server)).status;
			} catch {}
			return { ...server, containerStatus };
		})
	);
	return { servers: list };
};
