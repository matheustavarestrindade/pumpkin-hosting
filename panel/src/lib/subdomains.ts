// Reserved subdomains that can never be used for game servers.
export const RESERVED_SUBDOMAINS = new Set([
	'www',
	'api',
	'panel',
	'mail',
	'app',
	'dashboard',
	'billing',
	'status',
	'docs',
	'help',
	'support',
	'ftp',
	'smtp',
	'imap',
	'pop',
	'ns1',
	'ns2',
	'admin',
	'cdn',
	'static',
	'assets'
]);

export const SUBDOMAIN_REGEX = /^[a-z0-9](-?[a-z0-9])*$/;

export function validateSubdomain(name: string): { ok: true } | { ok: false; reason: string } {
	if (name.length < 3 || name.length > 32) {
		return { ok: false, reason: 'Must be 3-32 characters' };
	}
	if (!SUBDOMAIN_REGEX.test(name)) {
		return { ok: false, reason: 'Only lowercase letters, numbers and dashes' };
	}
	if (RESERVED_SUBDOMAINS.has(name)) {
		return { ok: false, reason: 'This name is reserved' };
	}
	return { ok: true };
}
