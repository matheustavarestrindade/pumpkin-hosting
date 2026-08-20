import { db } from '$lib/server/db';
import { nodes, servers, user as userTable } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [stats] = await db
		.select({
			totalServers: sql<number>`count(*)`,
			runningServers: sql<number>`count(*) filter (where ${servers.status} = 'running')`
		})
		.from(servers);

	const [userStats] = await db.select({ totalUsers: sql<number>`count(*)` }).from(userTable);

	const allNodes = await db.select().from(nodes);

	const allServers = await db
		.select({
			id: servers.id,
			name: servers.name,
			subdomain: servers.subdomain,
			status: servers.status,
			type: servers.type,
			createdAt: servers.createdAt,
			ownerEmail: userTable.email
		})
		.from(servers)
		.innerJoin(userTable, eq(userTable.id, servers.userId))
		.orderBy(desc(servers.createdAt))
		.limit(100);

	const allUsers = await db
		.select({
			id: userTable.id,
			email: userTable.email,
			name: userTable.name,
			createdAt: userTable.createdAt,
			serverCount: sql<number>`count(${servers.id})`
		})
		.from(userTable)
		.leftJoin(servers, eq(servers.userId, userTable.id))
		.groupBy(userTable.id)
		.orderBy(desc(userTable.createdAt))
		.limit(100);

	return {
		stats: {
			totalServers: Number(stats?.totalServers ?? 0),
			runningServers: Number(stats?.runningServers ?? 0),
			totalUsers: Number(userStats?.totalUsers ?? 0)
		},
		nodes: allNodes,
		servers: allServers,
		users: allUsers
	};
};
