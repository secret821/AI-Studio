import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';

export const AUTH_COOKIE_NAME = 'ai_studio_auth';
export const AUTH_USERNAME = 'liu';
export const AUTH_PASSWORD = '321000';
const AUTH_COOKIE_VALUE = 'logged-in';

export const AUTH_COOKIE_OPTIONS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: !dev,
	maxAge: 60 * 60 * 24 * 7
};

export function validateCredentials(username: string, password: string): boolean {
	return username === AUTH_USERNAME && password === AUTH_PASSWORD;
}

export function setAuthCookie(cookies: Cookies): void {
	cookies.set(AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, AUTH_COOKIE_OPTIONS);
}

export function clearAuthCookie(cookies: Cookies): void {
	cookies.delete(AUTH_COOKIE_NAME, { path: '/' });
}

export function isAuthenticated(cookies: Cookies): boolean {
	return cookies.get(AUTH_COOKIE_NAME) === AUTH_COOKIE_VALUE;
}

export function normalizeRedirectPath(redirectTo: string | null): string {
	if (!redirectTo) return '/';
	if (!redirectTo.startsWith('/')) return '/';
	if (redirectTo.startsWith('//')) return '/';
	return redirectTo;
}
