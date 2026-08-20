import { env } from '$env/dynamic/private';

/**
 * Sends an email via Resend when RESEND_API_KEY is set, otherwise logs the
 * content (dev mode). Add a Resend key in production.
 */
export async function sendEmail(to: string, subject: string, text: string) {
	if (!env.RESEND_API_KEY) {
		console.log(`[email:dev] to=${to} subject=${subject}\n${text}`);
		return;
	}
	const res = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			authorization: `Bearer ${env.RESEND_API_KEY}`,
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			from: env.EMAIL_FROM ?? 'hosting-mc <no-reply@example.com>',
			to,
			subject,
			text
		})
	});
	if (!res.ok) {
		console.error('email send failed', res.status, await res.text());
	}
}
