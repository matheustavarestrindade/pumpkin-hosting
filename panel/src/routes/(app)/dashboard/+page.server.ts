import { db } from '$lib/server/db';
import { servers } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const list = await db
		.select()
		.from(servers)
		.where(eq(servers.userId, user.id))
		.orderBy(desc(servers.createdAt));
	return { servers: list };
};
