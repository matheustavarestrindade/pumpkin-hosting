import { redirect, type RequestEvent } from '@sveltejs/kit';

type Locals = RequestEvent['locals'];

/** Returns the logged-in user or redirects to /login. Use in every load and action. */
export function requireUser(locals: Locals) {
	if (!locals.user) redirect(303, '/login');
	return locals.user;
}
