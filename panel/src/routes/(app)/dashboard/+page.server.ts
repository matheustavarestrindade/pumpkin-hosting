import { db } from '$lib/server/db';
import { servers } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const list = await db
		.select()
		.from(servers)
		.where(eq(servers.userId, locals.user!.id))
		.orderBy(desc(servers.createdAt));
	return { servers: list };
};
