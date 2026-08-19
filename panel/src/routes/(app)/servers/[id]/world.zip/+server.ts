import { agent } from '$lib/server/agent';
import { db } from '$lib/server/db';
import { nodes, servers } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = requireUser(locals);

	const [row] = await db
		.select({ server: servers, node: nodes })
		.from(servers)
		.innerJoin(nodes, eq(nodes.id, servers.nodeId))
		.where(and(eq(servers.id, params.id), eq(servers.userId, user.id)))
		.limit(1);
	if (!row) error(404, 'Server not found');

	const res = await agent.downloadWorld(row.node, row.server);
	if (!res.ok || !res.body) {
		error(502, 'Could not pack the world. Is the server created?');
	}

	return new Response(res.body, {
		headers: {
			'content-type': 'application/zip',
			'content-disposition': `attachment; filename="${row.server.subdomain}-world.zip"`
		}
	});
};
