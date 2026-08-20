import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { requireUser } from '$lib/server/guard';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const [row] = await db
		.select({ isAdmin: userTable.isAdmin })
		.from(userTable)
		.where(eq(userTable.id, user.id))
		.limit(1);
	if (!row?.isAdmin) redirect(303, '/dashboard');
	return {};
};
