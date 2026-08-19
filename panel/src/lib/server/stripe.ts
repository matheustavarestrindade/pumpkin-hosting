import { env } from '$env/dynamic/private';
import Stripe from 'stripe';

export const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export const stripePriceId = env.STRIPE_PRICE_ID ?? '';

/** True when Stripe keys are configured. Without keys the panel runs in dev mode
 *  (servers activate immediately without payment). */
export const billingEnabled = stripe !== null && stripePriceId !== '';

export async function getOrCreateCustomer(user: {
	id: string;
	email: string;
	name: string;
	stripeCustomerId: string | null;
}): Promise<string> {
	if (!stripe) throw new Error('Stripe not configured');
	if (user.stripeCustomerId) return user.stripeCustomerId;

	const existing = await stripe.customers.list({ email: user.email, limit: 1 });
	const customer =
		existing.data[0] ??
		(await stripe.customers.create({
			email: user.email,
			name: user.name,
			metadata: { userId: user.id }
		}));
	return customer.id;
}

export async function createCheckout(opts: {
	serverId: string;
	customerId: string;
	successUrl: string;
	cancelUrl: string;
}): Promise<string> {
	if (!stripe) throw new Error('Stripe not configured');
	const session = await stripe.checkout.sessions.create({
		mode: 'subscription',
		customer: opts.customerId,
		line_items: [{ price: stripePriceId, quantity: 1 }],
		client_reference_id: opts.serverId,
		metadata: { serverId: opts.serverId },
		subscription_data: { metadata: { serverId: opts.serverId } },
		success_url: opts.successUrl,
		cancel_url: opts.cancelUrl
	});
	if (!session.url) throw new Error('Stripe did not return a checkout URL');
	return session.url;
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
	if (!stripe) throw new Error('Stripe not configured');
	const session = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: returnUrl
	});
	return session.url;
}
