import { json, redirect, type Handle } from '@sveltejs/kit';
import {
	AUTH_USERNAME,
	isAuthenticated,
	normalizeRedirectPath
} from '$lib/server/auth';

const PUBLIC_PATHS = new Set(['/login', '/logout']);

function isPublicPath(pathname: string): boolean {
	if (PUBLIC_PATHS.has(pathname)) return true;
	if (pathname.startsWith('/_app/')) return true;
	if (pathname.startsWith('/favicon')) return true;
	return false;
}

export const handle: Handle = async ({ event, resolve }) => {
	const authenticated = isAuthenticated(event.cookies);
	event.locals.user = authenticated ? { username: AUTH_USERNAME } : null;

	const { pathname, search } = event.url;
	const publicPath = isPublicPath(pathname);

	if (!authenticated && !publicPath) {
		if (pathname.startsWith('/api/')) {
			return json({ error: '未授权，请先登录' }, { status: 401 });
		}

		const target = normalizeRedirectPath(`${pathname}${search}`);
		throw redirect(303, `/login?redirectTo=${encodeURIComponent(target)}`);
	}

	if (authenticated && pathname === '/login') {
		const redirectTo = normalizeRedirectPath(event.url.searchParams.get('redirectTo'));
		throw redirect(303, redirectTo);
	}

	return resolve(event);
};
