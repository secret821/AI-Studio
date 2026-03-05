import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	return {
		authenticated: Boolean(locals.user),
		username: locals.user?.username ?? null
	};
};
